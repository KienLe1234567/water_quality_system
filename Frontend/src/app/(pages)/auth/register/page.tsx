"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Eye, EyeOff, Lock, Mail, PersonStanding } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import { register } from "../actions";

export default function LoginPage() {
  const [state, formAction] = useFormState(register, {
    type: "",
    value: [],
  });
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  useEffect(() => {
    if (state.type === "success") {
      toast({
        variant: "success",
        title: state.type.toUpperCase(),
        description: "Register success",
      });
      router.push("/");
    }
    if (state.type !== "success" && state.value.length !== 0) {
      toast({
        variant: "destructive",
        title: state.type.toUpperCase(),
        description: "Error registering account",
      });
    }
  }, [state]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-sky-100 to-cyan-100">
      <Card className="w-full max-w-md overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200 via-sky-200 to-cyan-200 opacity-50" />
        <CardHeader className="relative space-y-1">
          <CardTitle className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent">
            Register
          </CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="relative space-y-4">
            <div className="flex gap-2">
              <div className="space-y-2">
                <Label
                  htmlFor="fname"
                  className="text-sm font-medium text-gray-700"
                >
                  First name
                </Label>
                <div className="relative">
                  <PersonStanding
                    className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500"
                    size={20}
                  />
                  <Input
                    id="fname"
                    name="fname"
                    className="border-2 border-transparent pl-10 transition-colors focus:border-blue-300"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="lname"
                  className="text-sm font-medium text-gray-700"
                >
                  Last name
                </Label>
                <div className="relative">
                  <PersonStanding
                    className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500"
                    size={20}
                  />
                  <Input
                    id="lname"
                    name="lname"
                    className="border-2 border-transparent pl-10 transition-colors focus:border-blue-300"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-sm font-medium text-gray-700"
              >
                Username
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500"
                  size={20}
                />
                <Input
                  id="username"
                  name="username"
                  className="border-2 border-transparent pl-10 transition-colors focus:border-blue-300"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500"
                  size={20}
                />
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="m@example.com"
                  className="border-2 border-transparent pl-10 transition-colors focus:border-blue-300"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500"
                  size={20}
                />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="border-2 border-transparent pl-10 pr-10 transition-colors focus:border-blue-300"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="relative flex flex-col space-y-4">
            <SubmitButton />
            <div className="flex items-center justify-between text-center text-sm text-gray-600">
              <Link
                href="/auth/login"
                className="underline underline-offset-4 transition-colors hover:text-blue-600"
              >
                Already have an account? Login now
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full transform bg-gradient-to-r from-blue-500 to-cyan-500 text-white transition-all duration-300 hover:scale-105 hover:from-blue-600 hover:to-cyan-600"
      disabled={pending}
    >
      {pending ? "Registering..." : "Register"}
    </Button>
  );
};
