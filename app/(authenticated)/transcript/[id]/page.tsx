"use client";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useParams, useRouter } from "next/navigation";
import { useRecordings } from "@/app/context/RecordingsContext";

export default function TranscriptPage() {
  const { id } = useParams();
  const router = useRouter();

  const { recordings, loading } = useRecordings();

  const recording = recordings.find((recording) => recording.id === id);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="block">
                <BreadcrumbLink onClick={() => router.push("/home")} className="cursor-pointer">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{recording?.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
      </header>
    </>
  );
}
