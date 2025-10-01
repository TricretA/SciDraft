import React from 'react'

// Updated interface to support both old and new prop patterns
interface ReportRendererProps {
  // New interface - content prop (used by ReportViewer)
  content?: string | object
  // Legacy interface - backward compatibility
  aiResponse?: string
  reportTitle?: string
  reportDate?: string
}

interface ReportData {
  title?: string
  introduction?: string
  objectives?: string[]
  materials?: string[]
  procedures?: string
  results?: string
  discussion?: string
  conclusion?: string
  recommendations?: string[]
  references?: Array<{
    author: string
    year: string
    title: string
    edition: string
    page: string
  }>
}

export function ReportRenderer({ content, aiResponse, reportTitle, reportDate }: ReportRendererProps) {
  // DEBUG: Log all incoming props
  console.log('🔍 ReportRenderer DEBUG - Props received:', {
    content: content,
    contentType: typeof content,
    contentKeys: content && typeof content === 'object' ? Object.keys(content) : 'N/A',
    aiResponse: aiResponse ? aiResponse.substring(0, 100) + '...' : null,
    reportTitle,
    reportDate
  });

  // Determine the data source and format
  const getReportContent = (): { data: ReportData | null; title: string; date: string } => {
    console.log('🔍 getReportContent called with:', { content, aiResponse });
    console.log('🔍 Content type:', typeof content, 'aiResponse type:', typeof aiResponse);
    
    // Try content first, then aiResponse
    const rawData = content || aiResponse;
    console.log('🔍 Using rawData:', { rawData, type: typeof rawData });
    
    if (!rawData) {
      console.log('🔍 No raw data available');
      return {
        data: null,
        title: 'Science Lab Report',
        date: new Date().toISOString()
      };
    }

    // If rawData is already an object, use it directly
    if (typeof rawData === 'object' && rawData !== null) {
      console.log('🔍 Raw data is object, using directly:', rawData);
      console.log('🔍 Object keys:', Object.keys(rawData));
      console.log('🔍 Object sample values:', {
        title: (rawData as any).title,
        introduction: (rawData as any).introduction ? 'present' : 'missing',
        results: (rawData as any).results ? 'present' : 'missing',
        procedures: (rawData as any).procedures ? 'present' : 'missing'
      });
      return {
        data: rawData as ReportData,
        title: (rawData as any)?.title || 'Science Lab Report',
        date: new Date().toISOString()
      };
    }

    // If rawData is a string, try to parse it
    if (typeof rawData === 'string') {
      console.log('🔍 Raw data is string, attempting to parse');
      const parsed = parseReportData(rawData);
      console.log('🔍 Parsed result:', parsed);
      return {
        data: parsed,
        title: parsed?.title || 'Science Lab Report',
        date: new Date().toISOString()
      };
    }

    console.log('🔍 No valid content found, returning null');
    return {
      data: null,
      title: 'Science Lab Report',
      date: new Date().toISOString()
    };
  };

  // Hardened JSON parsing with comprehensive fallback strategies
  const parseReportData = (response: string): ReportData | null => {
    console.log('🔍 parseReportData - Input:', typeof response, response ? response.substring(0, 200) + '...' : 'null/empty');
    
    if (!response || typeof response !== "string") {
      console.log('🔍 parseReportData - Invalid input, returning null');
      return null;
    }

    // If it's already an object with the expected structure
    if (typeof response === 'object' && response !== null) {
      console.log('✅ Content is already an object:', response);
      console.log('✅ Object has keys:', Object.keys(response));
      console.log('✅ Sample values:', {
        title: (response as any).title,
        introduction: (response as any).introduction ? 'present' : 'missing',
        results: (response as any).results ? 'present' : 'missing'
      });
      return response as ReportData;
    }

    // Step 1: Strip markdown/code fences & stray quotes
    let cleanResponse = response
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "")
      .replace(/^["'`]|["'`]$/g, "")
      .trim();
    
    console.log('🔍 parseReportData - After cleaning:', cleanResponse.substring(0, 200) + '...');

    // Step 2: Fix common JSON issues (trailing commas, escaped chars, weird spacing)
    cleanResponse = cleanResponse
      .replace(/,\s*([\]}])/g, "$1") // remove trailing commas
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/[\u0000-\u001F]+/g, ""); // remove invisible control chars

    // Step 3: Try direct JSON parsing
    try {
      const result = JSON.parse(cleanResponse);
      console.log('🔍 parseReportData - Direct parse SUCCESS:', result);
      return result;
    } catch (err) {
      console.warn("🔍 parseReportData - Direct parse failed, trying extraction:", err);
    }

    // Step 4: Extract largest JSON object from mixed text
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        let candidate = jsonMatch[0].replace(/,\s*([\]}])/g, "$1");
        const result = JSON.parse(candidate);
        console.log('🔍 parseReportData - Extraction parse SUCCESS:', result);
        return result;
      } catch (err) {
        console.warn("🔍 parseReportData - Extraction parse failed:", err);
      }
    }

    // Step 5: As last resort, try to eval in a sandbox (not recommended in prod without sanitization)
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${cleanResponse})`)();
      if (typeof result === "object") {
        console.log('🔍 parseReportData - Eval parse SUCCESS:', result);
        return result;
      }
    } catch (err) {
      console.warn("🔍 parseReportData - Eval parse failed:", err);
    }

    // Step 6: Give up only if all attempts failed
    console.error("❌ parseReportData - All parsing attempts failed. Raw input:", cleanResponse);
    return null;
  };

  const { data: report, title, date } = getReportContent();
  
  console.log('🔍 Final render decision - Report data:', report);
  console.log('🔍 Final render decision - Report is null/undefined:', !report);
  
  // Fallback display if no report data is available
  if (!report) {
    console.log('🔍 SHOWING FALLBACK - No report data available');
    const rawContent = content || aiResponse || 'No content available';
    console.log('🔍 FALLBACK - Raw content being displayed:', typeof rawContent, rawContent);
    
    // Try to parse the raw content as JSON in case it's a stringified JSON
    let displayContent = rawContent;
    if (typeof rawContent === 'string') {
      try {
        const parsed = JSON.parse(rawContent);
        if (typeof parsed === 'object' && parsed !== null) {
          // If it's a valid JSON object, try to render it as structured content
          if (parsed.title || parsed.introduction || parsed.pages) {
            console.log('🔍 FALLBACK - Found structured JSON in raw content:', parsed);
            return (
              <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-2xl space-y-6">
                <header className="text-center border-b pb-4">
                  <h1 className="text-2xl font-bold text-gray-900">{parsed.title || title}</h1>
                  <p className="text-gray-600 text-sm">
                    Generated on {new Date(date).toLocaleDateString()}
                  </p>
                </header>
                
                {parsed.introduction && (
                  <section>
                    <h2 className="text-xl font-semibold mb-3 text-black">Introduction</h2>
                    <div className="text-gray-900 leading-relaxed whitespace-pre-line">
                      {parsed.introduction}
                    </div>
                  </section>
                )}
                
                {parsed.pages && (
                  <section>
                    <h2 className="text-xl font-semibold mb-3 text-black">Content</h2>
                    <div className="text-gray-900 leading-relaxed whitespace-pre-line">
                      {parsed.pages}
                    </div>
                  </section>
                )}
                
                {/* Render any other properties */}
                {Object.entries(parsed).map(([key, value]) => {
                  if (key === 'title' || key === 'introduction' || key === 'pages') return null;
                  return (
                    <section key={key}>
                      <h2 className="text-xl font-semibold mb-3 text-black capitalize">{key.replace(/_/g, ' ')}</h2>
                      <div className="text-gray-900 leading-relaxed whitespace-pre-line">
                        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                      </div>
                    </section>
                  );
                })}
              </div>
            );
          } else {
            // It's JSON but not in expected format, display as formatted JSON
            displayContent = JSON.stringify(parsed, null, 2);
          }
        }
      } catch (e) {
        // Not valid JSON, keep as is
        console.log('🔍 FALLBACK - Raw content is not JSON, displaying as text');
      }
    }
    
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-2xl space-y-6">
        <header className="text-center border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 text-sm">
            Generated on {new Date(date).toLocaleDateString()}
          </p>
        </header>
        <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
          {typeof displayContent === 'string' ? displayContent : JSON.stringify(displayContent, null, 2)}
        </div>
      </div>
    )
  }
  
  console.log('🔍 RENDERING REPORT - Report sections available:', {
    title: !!report.title,
    introduction: !!report.introduction,
    objectives: !!report.objectives?.length,
    materials: !!report.materials?.length,
    procedures: !!report.procedures,
    results: !!report.results,
    discussion: !!report.discussion,
    conclusion: !!report.conclusion,
    recommendations: !!report.recommendations,
    references: !!report.references
  });

  // Utility for rendering list sections
  const renderList = (items: any) => {
    if (!Array.isArray(items)) {
      return <div className="text-gray-900">{typeof items === 'string' ? items : JSON.stringify(items, null, 2)}</div>;
    }
    return (
      <ul className="list-disc pl-6 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-gray-900">{typeof item === 'string' ? item : JSON.stringify(item, null, 2)}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-2xl space-y-6">
      {/* Header */}
      <header className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold text-black">{title}</h1>
        <p className="text-gray-600">Generated on {new Date(date).toLocaleDateString()}</p>
      </header>

      {/* Title */}
      {report.title && (
        <section>
          <h2 className="text-xl font-semibold mb-2 text-black">Title</h2>
          <p className="text-gray-900">{typeof report.title === 'string' ? report.title : JSON.stringify(report.title, null, 2)}</p>
        </section>
      )}

      {/* Introduction */}
      {report.introduction && (
        <section>
          <h2 className="text-xl font-semibold mb-3 text-black">Introduction</h2>
          <div className="text-gray-900 leading-relaxed whitespace-pre-line">
            {typeof report.introduction === 'string' ? report.introduction : JSON.stringify(report.introduction, null, 2)}
          </div>
        </section>
      )}

      {/* Objectives */}
      {report.objectives?.length && report.objectives.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-2 text-black">Objectives</h2>
          {renderList(report.objectives)}
        </section>
      )}

      {/* Materials */}
      {report.materials?.length && report.materials.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-2 text-black">Materials</h2>
          {renderList(report.materials)}
        </section>
      )}

      {/* Procedures */}
      {report.procedures && (
        <section>
          <h2 className="text-xl font-semibold mb-3 text-black">Procedures</h2>
          <div className="text-gray-900 leading-relaxed whitespace-pre-line">
            {typeof report.procedures === 'string' ? report.procedures : JSON.stringify(report.procedures, null, 2)}
          </div>
        </section>
      )}

      {/* Results */}
      {report.results && (
        <section>
          <h2 className="text-xl font-semibold mb-3 text-black">Results</h2>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="prose max-w-none text-gray-900 leading-relaxed whitespace-pre-line">
              {typeof report.results === 'string' ? report.results : JSON.stringify(report.results, null, 2)}
            </div>
          </div>
        </section>
      )}

      {/* Discussion */}
      {report.discussion && (
        <section>
          <h2 className="text-xl font-semibold mb-3 text-black">Discussion</h2>
          <div className="text-gray-900 leading-relaxed whitespace-pre-line">
            {typeof report.discussion === 'string' ? report.discussion : JSON.stringify(report.discussion, null, 2)}
          </div>
        </section>
      )}

      {/* Conclusion */}
      {report.conclusion && (
        <section>
          <h2 className="text-xl font-semibold mb-3 text-black">Conclusion</h2>
          <div className="text-gray-900 leading-relaxed whitespace-pre-line">
            {typeof report.conclusion === 'string' ? report.conclusion : JSON.stringify(report.conclusion, null, 2)}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {report.recommendations && (
        <section>
          <h2 className="text-xl font-semibold mb-3 text-black">Recommendations</h2>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            {Array.isArray(report.recommendations) ? (
              <ul className="list-disc pl-6 space-y-2">
                {report.recommendations.map((item, i) => (
                  <li key={i} className="text-gray-900 leading-relaxed">{item}</li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-900 leading-relaxed whitespace-pre-line">
                {typeof report.recommendations === 'string' ? report.recommendations : JSON.stringify(report.recommendations, null, 2)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* References */}
      {report.references && (
        <section>
          <h2 className="text-xl font-semibold mb-3 text-black">References</h2>
          <div className="space-y-2">
            {Array.isArray(report.references) ? (
              report.references.map((ref, index) => (
                <div key={index} className="text-gray-900 leading-relaxed">
                  {typeof ref === 'object' && ref.author ? (
                    <p className="text-sm">
                      <span className="font-medium">{ref.author}</span> ({ref.year}). 
                      <em>{ref.title}</em>
                      {ref.edition && ` (${ref.edition} ed.)`}
                      {ref.page && `, p. ${ref.page}`}.
                    </p>
                  ) : (
                    <p className="text-sm">{typeof ref === 'string' ? ref : JSON.stringify(ref)}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-gray-900 leading-relaxed whitespace-pre-line">
                {typeof report.references === 'string' ? report.references : JSON.stringify(report.references, null, 2)}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}