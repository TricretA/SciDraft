import React from 'react'
import { ReportRenderer } from '../components/ReportRenderer';

const ReportRendererTest: React.FC = () => {
  // Test data based on actual database content - this simulates double-stringified JSON from database
  const doubleStringifiedContent = JSON.stringify(`{"title": "Synthesis and Analysis of Aspirin (Acetylsalicylic Acid)", "introduction": "Aspirin, or acetylsalicylic acid, is a globally prominent pharmaceutical compound used worldwide for its analgesic, antipyretic, and anti-inflammatory properties.", "pages": "[Relevant Pages]"}`);
  
  const plainTextContent = "This is a test report with actual content to verify the ReportRenderer functionality.";
  
  const validJsonContent = JSON.stringify({
    title: "Test Chemistry Report",
    introduction: "This is a properly formatted introduction for testing purposes.",
    objectives: "To test the report rendering functionality",
    materials: "Test materials list",
    procedures: "Test procedures",
    results: "Test results",
    discussion: "Test discussion",
    conclusion: "Test conclusion",
    recommendations: "Test recommendations",
    references: "Test references",
    pages: "Test pages content"
  });

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">ReportRenderer Test Suite</h1>
      
      <div className="border p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Test 1: Double-stringified JSON (Problematic Content)</h2>
        <p className="text-sm text-gray-600 mb-4">This tests the content that was causing parsing issues before our fix.</p>
        <div className="border-l-4 border-red-500 pl-4">
          <ReportRenderer content={doubleStringifiedContent} aiResponse="" />
        </div>
      </div>
      
      <div className="border p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-600">Test 2: Plain Text Content</h2>
        <p className="text-sm text-gray-600 mb-4">This tests how plain text content is handled.</p>
        <div className="border-l-4 border-blue-500 pl-4">
          <ReportRenderer content={plainTextContent} aiResponse="" />
        </div>
      </div>
      
      <div className="border p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-green-600">Test 3: Valid JSON Content</h2>
        <p className="text-sm text-gray-600 mb-4">This tests properly formatted JSON content.</p>
        <div className="border-l-4 border-green-500 pl-4">
          <ReportRenderer content={validJsonContent} aiResponse="" />
        </div>
      </div>
      
      <div className="border p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-purple-600">Test 4: Empty/Null Content</h2>
        <p className="text-sm text-gray-600 mb-4">This tests edge cases with empty content.</p>
        <div className="border-l-4 border-purple-500 pl-4">
          <ReportRenderer content="" aiResponse="" />
        </div>
      </div>
    </div>
  );
};

export default ReportRendererTest;