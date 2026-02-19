"use client";

import { formatPFRatio, calculatePFRatio } from "@/lib/utils";
import type { VisitWithPhotos } from "@/types/visit";
import { format } from "date-fns";
import { Calendar, ImageIcon } from "lucide-react";
import Image from "next/image";

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
function isR2Url(url: string) {
  return R2_BASE.length > 0 && url.startsWith(R2_BASE);
}

interface PFRatioDisplayProps {
  visits: VisitWithPhotos[];
}

export function PFRatioDisplay({ visits }: PFRatioDisplayProps) {
  if (visits.length === 0) return null;

  return (
    <ul className="mt-3 space-y-4">
      {visits.map((visit) => {
        const fullness = Number(visit.fullnessScore);
        const taste = Number(visit.tasteScore);
        const price = Number(visit.pricePaid);
        const pfRatio = calculatePFRatio(fullness, taste, price);
        const photos = visit.photos ?? [];
        return (
          <li
            key={visit.id}
            className="rounded-xl border-2 border-border bg-card overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-muted/30 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                {format(new Date(visit.visitDate), "MMM d, yyyy")}
              </div>
              <div className="text-right">
                <span className="font-black italic text-primary">
                  PF {formatPFRatio(pfRatio)}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({fullness}F × {taste}T / ${price.toFixed(0)})
                </span>
              </div>
            </div>
            {photos.length > 0 ? (
              <div className="flex gap-2 p-3 flex-wrap">
                {photos.map((photo) => (
                  <a
                    key={photo.url}
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden border border-border bg-muted shrink-0 focus:ring-2 focus:ring-primary/30 focus:outline-none"
                  >
                    {isR2Url(photo.url) ? (
                      <Image
                        src={photo.url}
                        alt=""
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover"
                      />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element -- Fallback for non-R2 (legacy) URLs */
                      <img
                        src={photo.url}
                        alt=""
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover"
                      />
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" />
                No photos
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
