export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About Me</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 mb-6">
            Welcome! I&apos;m a passionate developer sharing my journey through technology, 
            coding experiences, and life lessons learned along the way.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Background</h2>
          <p className="text-gray-700 mb-6">
            This is where you can share your professional background, education, 
            and what drives your passion for technology and development.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Skills & Interests</h2>
          <p className="text-gray-700 mb-6">
            Here you can list your technical skills, programming languages, 
            frameworks, and areas of interest in technology.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why I Blog</h2>
          <p className="text-gray-700">
            Share your motivation for blogging, what you hope to achieve, 
            and how you want to help others in the developer community.
          </p>
        </div>
      </div>
    </div>
  );
}