import { useEffect, useState } from "react";
import { Avatar, message, Tooltip, Upload } from "antd";
import type { UploadProps } from "antd";
import { avatarUrl, getCurrentUser, uploadAvatar, type CurrentUser } from "../api/user";

const storageKey = (userId: number) => `ovo-chat-avatar:${userId}`;

export default function ProfileAvatar() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [source, setSource] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [toast, contextHolder] = message.useMessage();

  useEffect(() => {
    let active = true;
    getCurrentUser().then(current => {
      if (!active) return;
      setUser(current);
      const filename = localStorage.getItem(storageKey(current.id));
      if (filename) setSource(avatarUrl(filename));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const customRequest: NonNullable<UploadProps["customRequest"]> = async options => {
    const file = options.file as File;
    setUploading(true);
    try {
      const result = await uploadAvatar(file);
      if (user) localStorage.setItem(storageKey(user.id), result.filename);
      setSource(`${avatarUrl(result.filename)}?v=${Date.now()}`);
      options.onSuccess?.(result);
      toast.success("头像上传成功");
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error("头像上传失败"));
      toast.error(error instanceof Error ? error.message : "头像上传失败");
    } finally {
      setUploading(false);
    }
  };

  const beforeUpload: UploadProps["beforeUpload"] = file => {
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast.error("只能上传 PNG 或 JPEG 图片");
      return Upload.LIST_IGNORE;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("头像不能超过 2MB");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  return <>
    {contextHolder}
    <Tooltip title={user ? `${user.email} · 点击更换头像` : "点击上传头像"}>
      <Upload accept="image/png,image/jpeg" showUploadList={false} beforeUpload={beforeUpload}
        customRequest={customRequest} disabled={uploading}>
        <Avatar src={source} className="profile-avatar" style={{ cursor: uploading ? "wait" : "pointer", background: "#dce8fb", color: "#1768dd" }}>
          {user?.email.slice(0, 1).toUpperCase() ?? "U"}
        </Avatar>
      </Upload>
    </Tooltip>
  </>;
}
