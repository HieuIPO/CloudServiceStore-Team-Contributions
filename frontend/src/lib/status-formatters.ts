import { OrderStatus, AffiliateStatus } from "./api";

export type StatusGroup = "new" | "inProgress" | "completed" | "rejected" | "cancelled";

export type StatusPresentation = {
  label: string;
  group: StatusGroup;
  isFinal: boolean;
};

const parseOrderStatus = (status: OrderStatus | number | string): number => {
  if (typeof status === "number") return status;
  if (typeof status === "string") {
    switch (status.trim()) {
      case "Pending":
      case "1":
        return 1;
      case "Contacted":
      case "2":
        return 2;
      case "Approved":
      case "3":
        return 3;
      case "Rejected":
      case "4":
        return 4;
      case "Cancelled":
      case "5":
        return 5;
      default: {
        const parsed = parseInt(status, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
    }
  }
  return 0;
};

const parseAffiliateStatus = (status: AffiliateStatus | number | string): number => {
  if (typeof status === "number") return status;
  if (typeof status === "string") {
    switch (status.trim()) {
      case "Pending":
      case "1":
        return 1;
      case "UnderReview":
      case "2":
        return 2;
      case "Approved":
      case "3":
        return 3;
      case "Rejected":
      case "4":
        return 4;
      default: {
        const parsed = parseInt(status, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
    }
  }
  return 0;
};

export const getOrderStatusPresentation = (status: OrderStatus | number | string): StatusPresentation => {
  const code = parseOrderStatus(status);
  switch (code) {
    case 1:
      return { label: "Mới tạo", group: "new", isFinal: false };
    case 2:
      return { label: "Đã liên hệ", group: "inProgress", isFinal: false };
    case 3:
      return { label: "Đã duyệt", group: "completed", isFinal: true };
    case 4:
      return { label: "Từ chối", group: "rejected", isFinal: true };
    case 5:
      return { label: "Đã hủy", group: "cancelled", isFinal: true };
    default:
      return { label: "Không xác định", group: "new", isFinal: false };
  }
};

export const getAffiliateStatusPresentation = (status: AffiliateStatus | number | string): StatusPresentation => {
  const code = parseAffiliateStatus(status);
  switch (code) {
    case 1:
      return { label: "Chờ duyệt", group: "new", isFinal: false };
    case 2:
      return { label: "Đang xem xét", group: "inProgress", isFinal: false };
    case 3:
      return { label: "Đã duyệt", group: "completed", isFinal: true };
    case 4:
      return { label: "Từ chối", group: "rejected", isFinal: true };
    default:
      return { label: "Không xác định", group: "new", isFinal: false };
  }
};

export const getQueueItemStatusPresentation = (
  type: "order" | "affiliate",
  status: OrderStatus | AffiliateStatus | number | string
): StatusPresentation => {
  return type === "order" ? getOrderStatusPresentation(status) : getAffiliateStatusPresentation(status);
};

/** Convenience: map a status to its Vietnamese label */
export const getOrderStatusLabel = (status: OrderStatus | number | string): string =>
  getOrderStatusPresentation(status).label;

export const getAffiliateStatusLabel = (status: AffiliateStatus | number | string): string =>
  getAffiliateStatusPresentation(status).label;
