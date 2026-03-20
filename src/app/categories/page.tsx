import { Header } from '@/components/header';

export default function CategoriesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Categories</h1>
         <div className="text-center text-muted-foreground">
            No categories available yet.
        </div>
      </main>
    </div>
  );
}
