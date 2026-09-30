import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useLogin } from "@/hooks/use-login";
import { usePageTitle } from "@/hooks/use-page-title";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import logoCrisbar from "../../assets/logo_c_crisbar.png";
import { useQueryClient } from "@tanstack/react-query";

const AdminLoginPage = () => {
  usePageTitle("Login");

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const login = useLogin({});
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(["auth", "me"], data.user);
          navigate("/admin/dashboard");
        },
      },
    );
  };

  return (
    <div className="w-full min-h-dvh flex justify-center items-center p-4">
      <div className="w-full max-w-md rounded-2xl p-5 shadow-lg border-gray-100 border bg-white sm:p-6">
        <div className="flex flex-col justify-center items-center text-center">
          <img src={logoCrisbar} alt="Logo C Crisbar" width={50} />
          <h4 className="text-black font-extrabold text-3xl mt-3 sm:text-4xl">
            Welcome <span className="text-berry-red">Crisbro!</span>
          </h4>
          <p className="font-light text-sm text-gray-600">
            Silahkan login dengan akun admin anda
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-start items-center mt-8 space-y-3"
        >
          <div className="w-full">
            <label htmlFor="email" className="text-sm font-semibold">
              Email Address
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                id="email"
                className="w-full rounded-xl border border-gray-300 p-2 pl-10 outline-none focus:border-gray-500 text-sm font-semibold"
                placeholder="andrie.rahman@crisbar.id"
              />
            </div>
          </div>
          <div className="w-full">
            <label htmlFor="password" className="text-sm font-semibold">
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                id="password"
                className="w-full rounded-xl border border-gray-300 p-2 px-10 outline-none focus:border-gray-500 text-sm font-semibold"
                placeholder="Password anda"
              />
              {showPassword ? (
                <EyeOff
                  onClick={() => setShowPassword(false)}
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                />
              ) : (
                <Eye
                  onClick={() => setShowPassword(true)}
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                />
              )}
            </div>
          </div>

          {login.isError && (
            <p className="text-sm text-red-600">{login.error.message}</p>
          )}

          <div className="w-full mt-2">
            <button
              type="submit"
              disabled={login.isPending}
              className="text-white bg-berry-red rounded-xl p-3 w-full hover:bg-red-700 cursor-pointer"
            >
              {login.isPending ? "Memproses..." : "Masuk Dashboard"}
            </button>
          </div>
          <div className="text-center text-xs text-gray-500">
            <a href="https://wa.me/6281259783014">
              Belum punya akun atau lupa password? Hubungi kami.
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
