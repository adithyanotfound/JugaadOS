"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<"teacher" | "student">(
    (searchParams.get("role") as "teacher" | "student") || "student"
  );
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    username: "",
    grade: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!form.fullName.trim()) { toast.error("Full name is required"); return; }

    setLoading(true);
    try {
      const payload =
        role === "teacher"
          ? { role, fullName: form.fullName, email: form.email, password: form.password }
          : { role, fullName: form.fullName, username: form.username, grade: form.grade, password: form.password };

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const firstError = Object.values(data.details)[0];
          toast.error(Array.isArray(firstError) ? firstError[0] : String(firstError));
        } else {
          toast.error(data.error || "Signup failed");
        }
        return;
      }

      toast.success("Account created! Welcome to VidyaSetu.");
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
        <p className="text-gray-500 text-sm">Create your account</p>
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
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                className="h-11"
              />
            </div>

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
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="john_doe (lowercase, no spaces)"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "_") }))}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="grade">Class / Grade</Label>
                  <Input
                    id="grade"
                    type="text"
                    placeholder="e.g. 10-A or Grade 5"
                    value={form.grade}
                    onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                    className="h-11"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
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
                  Creating account...
                </span>
              ) : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href={`/auth/login?role=${role}`} className="text-black font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
