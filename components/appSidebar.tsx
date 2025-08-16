import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/app/context/AuthContext";
import { useRecordings } from "@/app/context/RecordingsContext";
import Image from "next/image";
import { Separator } from "@radix-ui/react-separator";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter, usePathname } from "next/navigation";
import { AlertCircle } from "lucide-react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, signOut } = useAuth();
  const { recordings, loading } = useRecordings();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div
          className="flex flex-row items-center justify-center mr-2 gap-1 cursor-pointer"
          onClick={() => router.push("/home")}
        >
          <Image src="/soundwave.svg" alt="soundwave" width={35} height={35} />
          <p className="text-lg font-sans">Transcription Tool</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <Separator
          className=" bg-gray-200 h-[1px] mx-2"
          orientation="horizontal"
        />
        {user && (
          <div className="px-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-accent transition-colors border border-gray-200 cursor-pointer">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  variant="destructive"
                  className="cursor-pointer"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/home"}>
                  <Link href="/home">Dashboard</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="-mt-4">
          <SidebarGroupLabel>Transcript History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <Skeleton className="w-full h-20" />
              ) : recordings.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    No recordings yet
                  </div>
                </div>
              ) : (
                recordings.map((recording) => (
                  <SidebarMenuItem key={recording.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === `/transcript/${recording.id}`}
                    >
                      <Link href={`/transcript/${recording.id}`}>
                        {recording.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
