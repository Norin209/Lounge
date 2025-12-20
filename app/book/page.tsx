// File: app/book/page.tsx
import BookingPage from "../_pages/BookingPage";
import PageLayout from "../_pages/layout";

export default function BookRoute() {
  return (
    <PageLayout>
      <BookingPage />
    </PageLayout>
  );
}