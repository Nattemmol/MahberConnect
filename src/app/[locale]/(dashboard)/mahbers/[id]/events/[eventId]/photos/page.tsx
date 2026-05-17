"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { use, useState, useRef } from "react";
import {
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { eventService, memberService } from "@/lib/api/service-factory";
import { EventPhoto } from "@/lib/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { canManageEvents } from "@/lib/utils";

export default function EventPhotosPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { id, eventId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<EventPhoto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const { user } = useAuthStore();

  const { data: event } = useQuery({
    queryKey: ["mahber-event", id, eventId],
    queryFn: () => eventService.getEventById(id, eventId),
  });

  const { data: photosResponse, isLoading: isPhotosLoading } = useQuery({
    queryKey: ["event-photos", id, eventId, currentPage, pageSize],
    queryFn: () => eventService.getPhotos(id, eventId, currentPage, pageSize),
  });

  const { data: currentMember } = useQuery({
    queryKey: ["mahber-member", id, user?.id],
    queryFn: () => memberService.getMemberById(id, user?.id || ""),
    enabled: !!user?.id,
  });
  const canManageEventsValue = canManageEvents(currentMember);

  const uploadMutation = useMutation<EventPhoto, Error, void>({
    mutationFn: async () => {
      const formData = new FormData();
      if (selectedFile) formData.append("file", selectedFile);
      if (caption) formData.append("caption", caption);
      return eventService.uploadPhoto(id, eventId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["event-photos", id, eventId],
      });
      toast.success("Photo uploaded successfully!");
      setShowUpload(false);
      setCaption("");
      setSelectedFile(null);
    },
    onError: () => toast.error("Failed to upload photo"),
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) =>
      eventService.deletePhoto(id, eventId, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["event-photos", id, eventId],
      });
      toast.success("Photo deleted successfully!");
      setShowDeleteDialog(false);
      setPhotoToDelete(null);
    },
    onError: () => toast.error("Failed to delete photo"),
  });

  const canDeletePhoto = (photo: EventPhoto) => {
    return canManageEventsValue || photo.uploader_id === user?.id;
  };

  const handleDeleteClick = (photo: EventPhoto) => {
    setPhotoToDelete(photo);
    setShowDeleteDialog(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    if (selectedFile) {
      uploadMutation.mutate();
    } else {
      // For mock purposes, if no file is selected but they click upload, we still trigger it
      // to test the flow with a placeholder image from the mock service
      uploadMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Event
      </Button>

      <PageHeader
        title={`${event?.title || "Event"} Photos`}
        description="View and share memories from this event."
      >
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Photo
        </Button>
      </PageHeader>

      {isPhotosLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : !photosResponse?.data || photosResponse.data.length === 0 ? (
        <div className="text-center py-16 glass rounded-card">
          <ImageIcon className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
          <p className="text-text-secondary text-lg">
            No photos have been uploaded yet.
          </p>
          <Button
            variant="link"
            onClick={() => setShowUpload(true)}
            className="mt-2 text-gold"
          >
            Be the first to share a memory!
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {photosResponse.data.map((photo) => (
              <Card key={photo.id} className="overflow-hidden group">
                <div className="aspect-square relative overflow-hidden bg-surface-active">
                  <Image
                    src={photo.file_path}
                    alt={photo.caption || "Event photo"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    {canDeletePhoto(photo) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteClick(photo)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <p className="text-white text-sm font-medium line-clamp-2">
                      {photo.caption}
                    </p>
                    <p className="text-white/70 text-xs mt-1">
                      By {photo.user?.name || "Unknown"}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {photosResponse.meta && photosResponse.meta.totalPages > 1 && (
            <div className="flex items-center justify-between py-4 border-t border-border-glass">
              <div className="text-sm text-text-muted">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, photosResponse.meta.total)} of{" "}
                {photosResponse.meta.total} photos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: photosResponse.meta.totalPages },
                    (_, i) => i + 1,
                  ).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(photosResponse.meta.totalPages, p + 1),
                    )
                  }
                  disabled={currentPage === photosResponse.meta.totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        title="Upload Photo"
      >
        <div className="space-y-6">
          <div
            className="border-2 border-dashed border-border-glass rounded-xl p-8 text-center hover:bg-surface-active/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <ImageIcon className="w-8 h-8 text-gold mb-2" />
                <p className="text-sm font-medium text-text-primary">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-text-muted mt-1">Click to change</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-text-muted mb-2" />
                <p className="text-sm font-medium text-text-primary">
                  Click to select a photo
                </p>
                <p className="text-xs text-text-muted mt-1">
                  JPG, PNG, up to 5MB
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              Caption (Optional)
            </label>
            <Input
              placeholder="Write a short description..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-glass">
            <Button variant="ghost" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadClick}
              isLoading={uploadMutation.isPending}
            >
              Upload
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Photo Confirmation Dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setPhotoToDelete(null);
        }}
        title="Delete Photo"
        description="Are you sure you want to delete this photo? This action cannot be undone."
      >
        <div className="flex flex-col gap-4 py-4">
          {photoToDelete && (
            <div className="relative w-full h-32 rounded-lg overflow-hidden">
              <Image
                src={photoToDelete.file_path}
                alt={photoToDelete.caption || "Photo to delete"}
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteDialog(false);
                setPhotoToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                photoToDelete && deleteMutation.mutate(photoToDelete.id)
              }
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
