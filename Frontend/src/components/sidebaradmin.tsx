import Link from "next/link"
import { Home, Newspaper, Cpu, Monitor, Database, Inbox,Users, MessagesSquare } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

export default function SidebarAdmin() {
  const navItems = [
    { href: "/homead", icon: <Home />, label: "Trang chủ" },
    { href: "/newsadmin", icon: <Newspaper />, label: "Bản tin" },
    { href: "/stationsadmin", icon: <Monitor />, label: "Trạm quan trắc" },
    { href: "/realtimeadmin", icon: <Database />, label: "Dữ liệu thực" },
    { href: "/requestusers", icon: <Inbox />, label: "Yêu cầu từ người dùng" },
    { href: "/usersadmin", icon: <Users />, label: "Quản lý người dùng" },
    { href: "/modelmanage", icon: <Cpu />, label: "Quản lý model AI" },
    { href: "/chat", icon: <MessagesSquare />, label: "Trò chuyện" },
  ]

  return (
    <div className="flex w-16 transition-all duration-200 ease-in-out">
      <div className="bg-white h-full p-4 border-r border-gray-200 w-16 flex flex-col items-center space-y-6">
        {navItems.map((item, index) => (
          <Tooltip key={index} delayDuration={0}>
            <TooltipTrigger asChild>
              <Link href={item.href}>
                <div className="text-gray-800 hover:text-blue-600 cursor-pointer">
                  {item.icon}
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="z-[9999]">
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
