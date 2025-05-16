import { ResearchForm } from '@/components/scholarai/ResearchForm';
import { handleSearch, handleResearch } from '@/app/actions';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-start min-h-screen w-full bg-background p-6 md:p-8">
      <div className="text-center mt-[10vh] sm:mt-[15vh] mb-10 sm:mb-12">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-3">
          Contvia
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl font-medium text-foreground mb-2">
          The only research workplace you need
        </p>
        <p className="text-base sm:text-lg text-muted-foreground">
          Your AI-Powered Research Assistant
        </p>
      </div>

      <div className="w-full max-w-xl">
        <ResearchForm handleSearch={handleSearch} handleResearch={handleResearch} />
      </div>
      
      <p className="text-xs text-muted-foreground mt-auto pt-8 pb-4"> 
        Tip: Use "Deep Research" for AI-powered query refinement and deeper analysis.
      </p>
    </main>
  );
}
