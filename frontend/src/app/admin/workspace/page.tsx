import type { Metadata } from "next";
import { EditorWorkspaceClient } from "@/components/admin/editor-workspace-client";

export const metadata: Metadata = { title: "Workspace xử lý công việc" };

export default function AdminWorkspacePage() {
  return <EditorWorkspaceClient />;
}
