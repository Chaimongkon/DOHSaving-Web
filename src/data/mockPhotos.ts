// Mock data matching Prisma `PhotoAlbum` model
// When backend is ready, replace with API call: fetch("/api/photos")

export interface PhotoAlbumData {
  id: number;
  title: string;
  coverImage: string | null;
  photoCount: number;
  isActive: boolean;
  createdAt: string;
}

export const mockPhotoAlbums: PhotoAlbumData[] = [
  {
    id: 1,
    title: "กิจกรรมวันสถาปนาสหกรณ์ 18-20 ธันวาคม 2567",
    coverImage: "https://picsum.photos/id/1057/400/300",
    photoCount: 45,
    isActive: true,
    createdAt: "2025-12-20T09:00:00Z",
  },
  {
    id: 2,
    title: "กิจกรรม CSR ออกบูรณาการ ศึกษาดูงาน",
    coverImage: "https://picsum.photos/id/1067/400/300",
    photoCount: 32,
    isActive: true,
    createdAt: "2025-11-15T09:00:00Z",
  },
  {
    id: 3,
    title: "สหกรณ์ออมทรัพย์จัดอบรมให้ความรู้ ก.ย. 2568",
    coverImage: "https://picsum.photos/id/1072/400/300",
    photoCount: 28,
    isActive: true,
    createdAt: "2025-09-10T09:00:00Z",
  },
  {
    id: 4,
    title: "โครงการความรับผิดชอบต่อสังคม (CSR)",
    coverImage: "https://picsum.photos/id/1047/400/300",
    photoCount: 20,
    isActive: true,
    createdAt: "2025-08-05T09:00:00Z",
  },
  {
    id: 5,
    title: "ศึกษาดูงาน การรักษาแนวปะการัง สมุทรปราการ",
    coverImage: "https://picsum.photos/id/1015/400/300",
    photoCount: 35,
    isActive: true,
    createdAt: "2025-07-20T09:00:00Z",
  },
  {
    id: 6,
    title: "สัมมนา การเงินโครงสร้างเดือน การสหกรณ์",
    coverImage: "https://picsum.photos/id/1036/400/300",
    photoCount: 18,
    isActive: true,
    createdAt: "2025-06-15T09:00:00Z",
  },
];
