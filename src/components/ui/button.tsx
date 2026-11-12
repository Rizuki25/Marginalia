import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

/**
 * Buttons are cut from the pixel grid: stepped corners instead of a radius,
 * a 2px lift on hover, and a focus ring drawn inside the cut shape. A regular
 * outline would be clipped away by `clip-path`, so the ring uses an inset
 * shadow in `currentColor`, which stays visible on every variant.
 */
const buttonVariants = cva(
  "pixel-corners inline-flex shrink-0 select-none items-center justify-center gap-2 border-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em] whitespace-nowrap outline-none transition-[background-color,color,transform] duration-150 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_currentColor] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-ink bg-neon text-on-accent hover:-translate-y-0.5 hover:bg-[#c6eb00] active:translate-y-0 active:bg-[#b3d600]",
        outline:
          "border-ink bg-paper text-ink hover:-translate-y-0.5 hover:bg-ink hover:text-paper active:translate-y-0",
        ghost:
          "border-transparent bg-transparent text-ink hover:bg-ink/[0.06] active:bg-ink/[0.12]",
        link: "border-transparent bg-transparent text-ink underline underline-offset-4 hover:no-underline",
        destructive:
          "border-ink bg-paper text-ink hover:-translate-y-0.5 hover:bg-danger-fill hover:text-on-danger",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3.5 text-[10px]",
        lg: "h-12 px-6",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-xs": "size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
