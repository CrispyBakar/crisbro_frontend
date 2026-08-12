import { describe, expect, it } from "vitest";
import { dateFormat, dateTimeFormat } from "./adminFormatters";

// M-4 (lanjutan): backend kini menjamin batas rentang dan bucket tren berada di
// hari kalender WIB. Test ini mengunci sisi render agar jaminan itu tidak batal
// di browser: tanpa `timeZone` eksplisit, Intl memakai zona perangkat pembaca
// sehingga tanggal bisa bergeser satu hari bagi staf yang membuka konsol dari
// zona lain.
//
// `Intl.DateTimeFormat` menerima `timeZone` terlepas dari zona proses, jadi
// hasilnya dapat diuji langsung tanpa menjalankan ulang test di banyak TZ.

describe("dateFormat", () => {
  it("merender label kalender 'YYYY-MM-DD' apa adanya, tanpa mundur sehari", () => {
    // redemption_trend[].date dari backend berupa label hari WIB.
    expect(dateFormat("2026-08-12")).toBe("12 Agu 2026");
    expect(dateFormat("2026-01-01")).toBe("01 Jan 2026");
  });

  it("merender instant pada kalender WIB, bukan kalender UTC", () => {
    // 11 Agu 20:00Z == 12 Agu 03:00 WIB -> harus tampil 12 Agustus.
    expect(dateFormat("2026-08-11T20:00:00.000Z")).toBe("12 Agu 2026");
    // 12 Agu 16:59:59.999Z == 12 Agu 23:59 WIB -> masih 12 Agustus.
    expect(dateFormat("2026-08-12T16:59:59.999Z")).toBe("12 Agu 2026");
    // 12 Agu 17:00Z == 13 Agu 00:00 WIB -> sudah berganti hari.
    expect(dateFormat("2026-08-12T17:00:00.000Z")).toBe("13 Agu 2026");
  });

  it("konsisten pada pergantian tahun", () => {
    // 31 Des 17:00Z == 1 Jan 00:00 WIB.
    expect(dateFormat("2026-12-31T17:00:00.000Z")).toBe("01 Jan 2027");
  });
});

describe("dateTimeFormat", () => {
  it("menampilkan jam WIB, bukan jam zona perangkat", () => {
    expect(dateTimeFormat("2026-08-11T20:00:00.000Z")).toContain("12 Agu 2026");
    expect(dateTimeFormat("2026-08-11T20:00:00.000Z")).toContain("03");
  });
});
