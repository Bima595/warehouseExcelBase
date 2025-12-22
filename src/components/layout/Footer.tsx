export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex h-12 sm:h-16 items-center justify-center px-3 sm:px-4">
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} Warehouse Management System. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

