import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from 'date-fns';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const getStatusTextColor = (status: string) => {
  switch (status) {
    case "Rất tốt":
      return "text-emerald-900";
    case "Tốt":
      return "text-green-800";
    case "Bình thường":
      return "text-amber-800";
    case "Không tốt":
      return "text-orange-800";
    case "Nguy hiểm":
      return "text-red-800";
    default:
      return "text-gray-800";
  }
};
export const getDonvi = (featureName: string): string => { // <<< THÊM export const
  if (!featureName) {
    return "";
  }

  const normalizedFeature = featureName.toUpperCase().trim();

  switch (normalizedFeature) {
    case "DO":
      return "mg/l";
    case "EC":
      // Sử dụng LaTeX: $\mu$S/cm
      return "µS/cm";
    case "N-NO2":
    case "N-NH4":
    case "P-PO4":
    case "TSS":
    case "COD":
      return "mg/l";
    case "AH":
      return "CFU/ml";
    case "PH":
    case "WQI":
      return "";
    // Thêm các case khác nếu cần
    default:
      // console.warn(`Không tìm thấy đơn vị cho chỉ số: ${featureName}`);
      return "";
  }
};
export function formatMonitoringTime(timeString: string | undefined | null): string {
    if (!timeString) {
        return "N/A";
    }

    try {
        // Sử dụng parseISO để phân tích cú pháp chuỗi ISO 8601 một cách đáng tin cậy hơn.
        // Nếu timeString có thể ở các định dạng khác, new Date(timeString) có thể linh hoạt hơn
        // nhưng kém tin cậy hơn đối với các định dạng không chuẩn.
        const dateObject = parseISO(timeString);

        // Kiểm tra xem dateObject có phải là một ngày hợp lệ không
        if (isNaN(dateObject.getTime())) {
            console.warn(`formatMonitoringTime: Chuỗi ngày giờ không hợp lệ "${timeString}". Trả về chuỗi gốc.`);
            return timeString;
        }

        // Định dạng ngày giờ theo yêu cầu
        return format(dateObject, 'HH:mm, dd/MM/yyyy');

    } catch (error) {
        // Bắt lỗi nếu parseISO hoặc format thất bại (ví dụ: timeString không phải là chuỗi)
        console.error(`formatMonitoringTime: Lỗi khi định dạng thời gian "${timeString}":`, error);
        return timeString; // Trả về chuỗi gốc trong trường hợp có lỗi
    }
}