import Image from "next/image";
import { cn } from "cn";

export function BookCover({
  title,
  author,
  src,
  sizes,
  priority = false,
  className,
  textSize = "text-[15px]",
}: {
  title: string;
  author: string;
  src: string | null;
  sizes: string;
  priority?: boolean;
  className?: string;
  textSize?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden border border-ink bg-ink transition-shadow duration-200",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={`Sampul ${title}`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full flex-col justify-between p-3">
          <span className="label-sm text-paper/70">Sampul</span>
          <div>
            <p
              className={cn(
                "font-sans font-extrabold leading-[1.05] tracking-[-0.03em] text-paper",
                textSize,
              )}
            >
              {title}
            </p>
            <p className="label-sm mt-1.5 text-paper/60">{author}</p>
          </div>
        </div>
      )}
    </div>
  );
}
