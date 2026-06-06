"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<"teacher" | "student">(
    (searchParams.get("role") as "teacher" | "student") || "student"
  );
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", username: "", password: "" });

  const fillDemo = (demoRole: "teacher" | "student") => {
    setRole(demoRole);
    if (demoRole === "teacher") {
      setForm({ email: "priya.sharma@school.edu", username: "", password: "teacher123" });
    } else {
      setForm({ email: "", username: "aarav.sharma", password: "student123" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.password) { toast.error("Password is required"); return; }
    if (role === "teacher" && !form.email) { toast.error("Email is required"); return; }
    if (role === "student" && !form.username) { toast.error("Username is required"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, ...(role === "teacher" ? { email: form.email } : { username: form.username }), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }
      toast.success("Welcome back!");
      router.push(role === "teacher" ? "/dashboard/teacher" : "/dashboard/student");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <span className="text-yellow-400 font-bold text-lg">V</span>
          </div>
          <span className="text-2xl font-bold text-black">VidyaSetu</span>
        </div>
        <p className="text-gray-500 text-sm">Sign in to your account</p>
      </div>

      <Card className="w-full max-w-md shadow-lg border border-gray-100">
        <CardHeader className="pb-0">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${role === "student" ? "bg-black text-yellow-400 shadow-sm" : "text-gray-500 hover:text-black"
                }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${role === "teacher" ? "bg-black text-yellow-400 shadow-sm" : "text-gray-500 hover:text-black"
                }`}
            >
              Teacher
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {role === "teacher" ? (
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@school.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="h-11"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="your_username"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="h-11"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 btn-yellow border-0 text-sm font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Signing in...
                </span>
              ) : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href={`/auth/signup?role=${role}`} className="text-black font-semibold hover:underline">
              Sign up
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">Try a demo account</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo("student")}
                className="text-xs py-2 px-3 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-150 text-left"
              >
                <span className="block font-medium text-black">Student</span>
                <span className="text-gray-400">aarav.sharma</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("teacher")}
                className="text-xs py-2 px-3 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-150 text-left"
              >
                <span className="block font-medium text-black">Teacher</span>
                <span className="text-gray-400">priya.sharma@school.edu</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
