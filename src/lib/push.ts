import {
  deletePushSubscription,
  getVapidPublicKey,
  savePushSubscription,
} from "@/services/push";

const SERVICE_WORKER_URL = "/sw.js";

export type PushStatus =
  | "on"
  | "off"
  | "denied"
  | "needs-install"
  | "unsupported";

const isPushSupported = () =>
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

// iPhone/iPad: Web Push hanya ada di PWA yang sudah di-Add to Home Screen (iOS 16.4+)
const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

// Jangan pakai navigator.serviceWorker.ready: promise itu hanya resolve sekali
// per halaman, jadi setelah SW di-unregister/diganti (Clear site data, sw.js
// berubah) ia tetap mengembalikan registration lama tanpa worker aktif.
async function registerServiceWorker() {
  const registration =
    await navigator.serviceWorker.register(SERVICE_WORKER_URL);
  const worker =
    registration.installing ?? registration.waiting ?? registration.active;

  if (worker && worker.state !== "activated") {
    await new Promise<void>((resolve, reject) => {
      worker.addEventListener("statechange", () => {
        if (worker.state === "activated") resolve();
        if (worker.state === "redundant")
          reject(new Error("Service worker gagal dipasang"));
      });
    });
  }

  return registration;
}

async function getExistingSubscription() {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!isPushSupported()) {
    return isIos() && !isStandalone() ? "needs-install" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission !== "granted") return "off";
  return (await getExistingSubscription()) ? "on" : "off";
}

// `permission` adalah hasil Notification.requestPermission() yang dipanggil
// langsung di handler klik. Safari/Firefox menolak permintaan izin yang tidak
// berasal dari interaksi user, jadi jangan panggil requestPermission di sini.
export async function enablePush(permission: Promise<NotificationPermission>) {
  const result = await permission;
  if (result !== "granted") {
    throw new Error(
      result === "denied"
        ? "Izin notifikasi diblokir. Aktifkan lewat pengaturan situs di browser."
        : "Izin notifikasi belum diberikan",
    );
  }

  const [registration, publicKey] = await Promise.all([
    registerServiceWorker(),
    getVapidPublicKey(),
  ]);

  const subscription = await subscribe(registration, publicKey);

  await savePushSubscription(subscription);
}

const isSameKey = (current: ArrayBuffer | null, expected: Uint8Array) =>
  current !== null &&
  current.byteLength === expected.length &&
  new Uint8Array(current).every((byte, i) => byte === expected[i]);

async function subscribe(
  registration: ServiceWorkerRegistration,
  publicKey: string,
) {
  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  // Subscription lama yang dibuat dengan VAPID key lain (key diganti, atau
  // pindah backend lokal/staging) tidak bisa dipakai server untuk mengirim,
  // jadi buang dan buat ulang.
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    if (isSameKey(existing.options.applicationServerKey, applicationServerKey))
      return existing;
    await existing.unsubscribe();
  }

  try {
    return await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  } catch (error) {
    console.error("pushManager.subscribe gagal:", error);
    // "push service error" = browser gagal mendaftar ke push service-nya
    // sendiri (FCM untuk Chrome/Brave/Opera), bukan masalah kunci atau backend.
    if (
      error instanceof DOMException &&
      error.name === "AbortError" &&
      error.message.includes("push service")
    ) {
      throw new Error(
        "Browser gagal mendaftar ke layanan notifikasi. Coba matikan VPN/adblock atau gunakan browser lain.",
        { cause: error },
      );
    }
    throw error;
  }
}

export async function disablePush() {
  if (!isPushSupported()) return;

  const subscription = await getExistingSubscription();
  if (!subscription) return;

  // Hapus di server dulu (butuh sesi login), baru di browser. Kalau server
  // gagal, baris lamanya terhapus sendiri saat kiriman berikutnya dapat 410.
  await deletePushSubscription(subscription.endpoint).catch(() => undefined);
  await subscription.unsubscribe();
}

// Dipanggil saat app dibuka customer yang login: memastikan subscription di
// browser ini tercatat atas nama user tersebut. Tidak membuat subscription
// baru dan tidak memunculkan prompt izin.
export async function syncPushSubscription() {
  if (!isPushSupported() || Notification.permission !== "granted") return;

  const subscription = await getExistingSubscription();
  if (subscription) await savePushSubscription(subscription);
}
