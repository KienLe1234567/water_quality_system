import { Loader2 } from "lucide-react";

export default function PageLoader({ message = "Đang tải dữ liệu..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}