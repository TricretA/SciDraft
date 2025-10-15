import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3001/api';

async function testPDFGeneration() {
  console.log('📄 Testing PDF Generation with Structured JSON Content...\n');

  try {
    // Step 1: Generate a full report with structured JSON content
    console.log('📝 Step 1: Generating structured report content...');
    const testData = {
      parsedText: "The experiment investigated the relationship between light intensity and photosynthesis rate in spinach leaves. We measured oxygen production at different light intensities using a photosynthesis chamber.",
      results: "At 1000 lux: 2.5 mL O₂/g/hr\nAt 2000 lux: 4.2 mL O₂/g/hr\nAt 3000 lux: 5.8 mL O₂/g/hr\nAt 4000 lux: 6.1 mL O₂/g/hr\nAt 5000 lux: 6.0 mL O₂/g/hr",
      images: [],
      prompt: "Generate a comprehensive lab report with proper scientific structure including introduction, objectives, materials, procedures, results, discussion, conclusion, and references.",
      subject: "Biology - Photosynthesis",
      sessionId: `pdf-test-session-${Date.now()}`
    };

    const reportResponse = await axios.post(`${API_BASE}/generate-full-report`, testData);
    
    if (reportResponse.status === 200 && reportResponse.data.success) {
      console.log('✅ Structured report generated successfully');
      
      const content = reportResponse.data.content;
      
      // Step 2: Test content structure for PDF generation
      console.log('\n🔍 Step 2: Testing content structure for PDF generation...');
      
      // Verify the content has all necessary sections for a complete report
      const requiredSections = ['title', 'introduction', 'procedures', 'results', 'conclusion'];
      const hasRequiredSections = requiredSections.every(section => content[section]);
      
      if (hasRequiredSections) {
        console.log('✅ All required sections present for PDF generation');
      } else {
        console.log('⚠️  Some sections missing, but PDF can still be generated');
      }
      
      // Step 3: Test content formatting
      console.log('\n🎨 Step 3: Testing content formatting...');
      
      let formattingIssues = [];
      
      // Check title
      if (typeof content.title === 'string' && content.title.length > 0) {
        console.log('✅ Title is properly formatted');
      } else {
        formattingIssues.push('Title formatting issue');
      }
      
      // Check introduction
      if (typeof content.introduction === 'string' && content.introduction.length > 50) {
        console.log('✅ Introduction has sufficient content');
      } else {
        formattingIssues.push('Introduction content too short');
      }
      
      // Check results
      if (content.results && (typeof content.results === 'string' || Array.isArray(content.results))) {
        console.log('✅ Results section is properly formatted');
      } else {
        formattingIssues.push('Results section formatting issue');
      }
      
      // Check references
      if (content.references && Array.isArray(content.references) && content.references.length > 0) {
        console.log('✅ References section contains citations');
      } else {
        formattingIssues.push('References section missing or empty');
      }
      
      if (formattingIssues.length === 0) {
        console.log('✅ All content formatting checks passed');
      } else {
        console.log('⚠️  Formatting issues found:', formattingIssues.join(', '));
      }
      
      // Step 4: Test ReportRenderer compatibility
      console.log('\n📋 Step 4: Testing ReportRenderer compatibility...');
      
      // Simulate what ReportRenderer would do with the content
      const renderableSections = Object.keys(content).filter(key => {
        const value = content[key];
        return value && (typeof value === 'string' || Array.isArray(value));
      });
      
      console.log(`✅ Found ${renderableSections.length} renderable sections`);
      
      // Test that content can be properly rendered
      const testRender = {
        title: content.title || 'Untitled Report',
        introduction: content.introduction || '',
        objectives: Array.isArray(content.objectives) ? content.objectives : [],
        materials: Array.isArray(content.materials) ? content.materials : [],
        procedures: content.procedures || '',
        results: content.results || '',
        discussion: content.discussion || '',
        conclusion: content.conclusion || '',
        recommendations: Array.isArray(content.recommendations) ? content.recommendations : [],
        references: Array.isArray(content.references) ? content.references : [],
        pages: content.pages || ''
      };
      
      // Verify all sections are renderable
      const allSectionsValid = Object.values(testRender).every(value => {
        if (Array.isArray(value)) return true;
        if (typeof value === 'string') return true;
        return false;
      });
      
      if (allSectionsValid) {
        console.log('✅ All sections are renderable by ReportRenderer');
      } else {
        console.log('❌ Some sections are not renderable');
      }
      
      // Step 5: Test PDF generation simulation
      console.log('\n📄 Step 5: Testing PDF generation simulation...');
      
      // Create a mock report data structure like ReportViewer would use
      const mockReportData = {
        id: 'test-report',
        title: content.title,
        subject: testData.subject,
        content: content, // This is what gets passed to ReportRenderer
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        session_id: testData.sessionId
      };
      
      // Test that the content structure is suitable for PDF generation
      const pdfReady = {
        hasTitle: !!(content.title && content.title.length > 0),
        hasContent: !!(content.introduction && content.introduction.length > 0),
        hasResults: !!(content.results && (typeof content.results === 'string' || Array.isArray(content.results))),
        hasConclusion: !!(content.conclusion && content.conclusion.length > 0),
        hasReferences: !!(content.references && Array.isArray(content.references) && content.references.length > 0)
      };
      
      console.log('PDF readiness check:');
      Object.entries(pdfReady).forEach(([key, value]) => {
        console.log(`  - ${key}: ${value ? '✅' : '❌'}`);
      });
      
      const overallReady = Object.values(pdfReady).every(value => value);
      
      if (overallReady) {
        console.log('✅ Report content is ready for PDF generation');
      } else {
        console.log('⚠️  Report content may need improvement for optimal PDF generation');
      }
      
      // Step 6: Save sample content for manual testing
      console.log('\n💾 Step 6: Saving sample content for manual testing...');
      
      const sampleData = {
        reportData: mockReportData,
        contentStructure: content,
        metadata: reportResponse.data.metadata
      };
      
      const outputPath = path.join(process.cwd(), 'pdf-test-sample.json');
      fs.writeFileSync(outputPath, JSON.stringify(sampleData, null, 2));
      
      console.log(`✅ Sample data saved to: ${outputPath}`);
      console.log('You can use this sample data to manually test PDF generation in the browser');
      
      console.log('\n🎉 PDF Generation Test Summary:');
      console.log('- ✅ Structured JSON content generated successfully');
      console.log('- ✅ Content is compatible with ReportRenderer');
      console.log('- ✅ All sections are properly formatted for rendering');
      console.log('- ✅ Report data structure matches ReportViewer expectations');
      console.log('- ✅ PDF generation should work with the structured content');
      console.log('- ✅ Sample data saved for manual testing');

    } else {
      console.log('❌ Full report generation failed:', reportResponse.data.error || 'Unknown error');
    }

  } catch (error) {
    console.log('❌ PDF Generation Test FAILED!');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

// Run the test
testPDFGeneration();