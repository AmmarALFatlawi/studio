import { ResearchForm } from '@/components/scholarai/ResearchForm';
import { handleSearch, handleResearch } from '@/app/actions';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <ResearchForm handleSearch={handleSearch} handleResearch={handleResearch} />
    </main>
  );
}
