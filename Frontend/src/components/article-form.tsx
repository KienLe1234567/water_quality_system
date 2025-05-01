// src/components/article-form.tsx
"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Article, CreateArticleData } from "@/types/article";
import { FileInfo } from "@/types/file";
import { uploadFile } from "@/lib/file";
import { createArticle, updateArticle } from "@/lib/article";
import { useToast } from "../hooks/use-toast"; // Bạn cần cài đặt: npm install react-hot-toast
import { getMultipleFilesByFileIds } from "@/lib/file";
interface ArticleFormProps {
  token: string;
  existingArticle?: Article | null; // Dùng khi chỉnh sửa
  onSuccess: (article: Article) => void; // Callback khi thành công
  onCancel: () => void; // Callback khi hủy
}

const DEFAULT_BADGE = 'common';

const ArticleForm: React.FC<ArticleFormProps> = ({ token, existingArticle, onSuccess, onCancel }) => {
  const [existingPdfInfo, setExistingPdfInfo] = useState<FileInfo | null>(null); // <-- State mới
  const [isLoadingFileInfo, setIsLoadingFileInfo] = useState<boolean>(false);
  const {toast} = useToast()
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [badge, setBadge] = useState<string>(existingArticle?.badge ? existingArticle.badge : DEFAULT_BADGE);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPictureUrl, setExistingPictureUrl] = useState<string | null>(null);
  const [existingFileId, setExistingFileId] = useState<string | null>(null); // Chỉ lưu ID file PDF chính

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!existingArticle;

  useEffect(() => {
    setExistingPdfInfo(null);
    setIsLoadingFileInfo(false);

    if (isEditing && existingArticle) {
      setTitle(existingArticle.title);
      setContent(existingArticle.content);
      setBadge(existingArticle.badge? existingArticle.badge : DEFAULT_BADGE);
      setExistingPictureUrl(existingArticle.pictureUrl);
      const currentFileId = existingArticle.fileIds?.[0] || null;
      setExistingFileId(currentFileId);

      // *** Bổ sung logic fetch FileInfo ***
      if (currentFileId && token) {
        const fetchFileInfo = async () => {
          setIsLoadingFileInfo(true);
          try {
            console.log(`Form: Fetching info for file ID: ${currentFileId}`);
            const filesInfo = await getMultipleFilesByFileIds(token, { ids: [currentFileId] });
            if (filesInfo && filesInfo.length > 0) {
              setExistingPdfInfo(filesInfo[0]);
              console.log("Form: Fetched existing PDF info:", filesInfo[0]);
            } else {
              console.warn(`Form: File info not found for ID: ${currentFileId}`);
              setExistingPdfInfo(null); // Đảm bảo reset nếu không tìm thấy
            }
          } catch (error) {
            console.error("Form: Failed to fetch existing file info:", error);
            setExistingPdfInfo(null); // Reset khi có lỗi
            // Có thể set một state lỗi riêng cho việc fetch này nếu muốn
            toast({
              title: "Lỗi",
              description: "Không thể tải thông tin file PDF hiện tại.",
              variant: "destructive",
            });
          } finally {
            setIsLoadingFileInfo(false);
          }
        };
        fetchFileInfo();
      } else if (currentFileId && !token) {
          console.warn("Form: Cannot fetch file info without token.");
      }
      // *** Kết thúc bổ sung ***

    } else {
      // Reset form khi tạo mới
      setTitle('');
      setContent('');
      setBadge(DEFAULT_BADGE);
      setPictureFile(null);
      setPdfFile(null);
      setExistingPictureUrl(null);
      setExistingFileId(null);
      setExistingPdfInfo(null); // Reset cả info
    }
  }, [existingArticle, isEditing, token, toast]);

  const handlePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPictureFile(e.target.files[0]);
    }
  };

  const handlePdfChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    let uploadedPictureUrl = existingPictureUrl; // Giữ URL cũ nếu không thay đổi
    let uploadedFileId = existingFileId; // Giữ ID file cũ nếu không thay đổi

    try {
      // 1. Upload ảnh nếu có file mới
      if (pictureFile) {
        const pictureFormData = {
          type: 'article_image', // Hoặc loại phù hợp
          name: pictureFile.name,
          file: pictureFile,
        };
        console.log("Uploading picture...");
        const uploadedImageInfo: FileInfo = await uploadFile(token, pictureFormData);
        uploadedPictureUrl = uploadedImageInfo.url;
        console.log("Picture uploaded:", uploadedPictureUrl);
      }

      // 2. Upload PDF nếu có file mới
      if (pdfFile) {
        const pdfFormData = {
          type: 'article_pdf', // Hoặc loại phù hợp
          name: pdfFile.name,
          file: pdfFile,
        };
        console.log("Uploading PDF...");
        const uploadedFileInfo: FileInfo = await uploadFile(token, pdfFormData);
        uploadedFileId = uploadedFileInfo.id;
        console.log("PDF uploaded:", uploadedFileId);
      }

      // 3. Chuẩn bị dữ liệu cho article
      const articleData = {
        title,
        content,
        badge,
        pictureUrl: uploadedPictureUrl || '', // Đảm bảo không phải null/undefined
        fileIds: {ids: uploadedFileId ? [uploadedFileId] : []}, // Chỉ lưu ID file PDF mới hoặc cũ
      };
      const articleDataNew = {
        title,
        content,
        badge,
        pictureUrl: uploadedPictureUrl || '', // Đảm bảo không phải null/undefined
        fileIds: uploadedFileId ? [uploadedFileId] : [], // Chỉ lưu ID file PDF mới hoặc cũ
      };
      // 4. Gọi API tạo hoặc cập nhật
      let resultArticle: Article;
      if (isEditing && existingArticle) {
        console.log("Updating article:", existingArticle.id, articleData);
        resultArticle = await updateArticle(token, existingArticle.id, articleData);
        console.log(articleData)
        toast({
            title: "Thành công",
            description: "Cập nhật bản tin thành công.",
            variant: "success", // hoặc 'success'
        });
    
      } else {
        console.log("Creating article:", articleDataNew);
        resultArticle = await createArticle(token, articleDataNew as CreateArticleData); // Cần ép kiểu vì thiếu authorId
        toast({
            title: "Thành công",
            description: "Đăng bản tin thành công!",
            variant: "success", // hoặc 'success'
        });
      }

      onSuccess(resultArticle); // Gọi callback thành công

    } catch (err: any) {
      console.error("Error submitting article:", err);
      setError(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
      toast({
        title: "Lỗi",
        description: err.message || "Đã xảy ra lỗi khi gửi bản tin.",
        variant: "destructive", // hoặc 'success'
    });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-600 text-center">{error}</p>}

      <div>
        <Label htmlFor="title" className="text-lg font-medium">Tiêu đề</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1"
          placeholder="Nhập tiêu đề bản tin"
        />
      </div>

      <div>
        <Label htmlFor="content" className="text-lg font-medium">Nội dung tóm tắt</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="mt-1"
          rows={4}
          placeholder="Nhập mô tả ngắn gọn cho bản tin"
        />
      </div>

      <div>
        <Label htmlFor="badge" className="text-lg font-medium">Mức độ</Label>
        <Select value={badge} onValueChange={setBadge}>
          <SelectTrigger className="w-full mt-1">
            <SelectValue placeholder="Chọn mức độ cảnh báo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="common">Thông thường</SelectItem>
            <SelectItem value="good">Quan trọng</SelectItem>
            <SelectItem value="danger">Khẩn cấp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div>
            <Label htmlFor="picture" className="text-lg font-medium">Ảnh đại diện</Label>
             {existingPictureUrl && !pictureFile && (
                <div className="mt-2 text-sm">
                    Ảnh hiện tại: <a href={existingPictureUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate block">{existingPictureUrl}</a>
                </div>
             )}
            <Input
            id="picture"
            type="file"
            accept="image/*"
            onChange={handlePictureChange}
            className="mt-1 h-13 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
            {pictureFile && <p className="mt-1 text-sm text-gray-600">Đã chọn: {pictureFile.name}</p>}
             <p className="mt-1 text-xs text-gray-500">Để trống nếu muốn giữ ảnh cũ (khi sửa) hoặc dùng ảnh mặc định.</p>
        </div>

        <div>
          <Label htmlFor="pdf" className="text-lg font-medium">File PDF nội dung</Label>

          {/* Hiển thị thông tin file đã fetch thay vì ID */}
          {!pdfFile && ( // Chỉ hiện thông tin cũ khi chưa chọn file mới
            <div className="mt-1 text-sm"> {/* Thêm min-height để tránh nhảy layout */}
              {isLoadingFileInfo && (
                <div className="flex items-center text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải thông tin file...
                </div>
              )}
              {!isLoadingFileInfo && existingPdfInfo && (
                <div>
                  File PDF hiện tại:
                  {/* Sử dụng generateProxyUrl nếu muốn link xem được */}
                  <a
                    href={existingPdfInfo.url} // Hoặc generateProxyUrl(existingPdfInfo.url)
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline truncate block max-w-xs"
                    title={existingPdfInfo.name}
                  >
                    {existingPdfInfo.name}
                  </a>
                  {/* <span className="text-gray-500 text-xs block"> (Size: {existingPdfInfo.size})</span> */}
                </div>
              )}
              {!isLoadingFileInfo && !existingPdfInfo && existingFileId && (
                 // Fallback nếu không fetch được info nhưng có ID
                 <span className="text-gray-500">ID: {existingFileId} (Không tải được thông tin chi tiết)</span>
              )}
            </div>
          )}

          <Input
            id="pdf"
            type="file"
            accept="application/pdf"
            onChange={handlePdfChange}
            required={!isEditing || !existingFileId}
            className="mt-1 h-13 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" // Giữ lại height đã sửa nếu cần
          />
          {pdfFile && <p className="mt-1 text-sm text-gray-600">Đã chọn: {pdfFile.name}</p>}
          <p className="mt-1 text-xs text-gray-500">{isEditing ? 'Chọn file mới để thay thế file PDF cũ.' : 'Chọn file PDF chứa nội dung chi tiết.'}</p>
        </div>
      </div>


      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-orange-500 hover:bg-orange-600 text-white">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Đang cập nhật...' : 'Đang đăng...'}
            </>
          ) : (
            isEditing ? 'Lưu thay đổi' : 'Đăng bản tin'
          )}
        </Button>
      </div>
    </form>
  );
};

export default ArticleForm;