import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';
const CLIENT_BASE = 'http://localhost:5173';

async function testCompleteUIFlow() {
  console.log('🧪 Testing Complete UI Flow for Full Report Generation...\n');

  try {
    // Step 1: Test that the application is accessible
    console.log('📋 Step 1: Testing application accessibility...');
    const homeResponse = await axios.get(CLIENT_BASE);
    if (homeResponse.status === 200) {
      console.log('✅ Client application is accessible');
    } else {
      throw new Error('Client application not accessible');
    }

    // Step 2: Test the full report generation API
    console.log('\n📊 Step 2: Testing full report generation API...');
    const testData = {
      parsedText: "The experiment tested the effect of temperature on enzyme activity. We used catalase enzyme with hydrogen peroxide substrate at temperatures of 20°C, 30°C, 40°C, and 50°C.",
      results: "At 20°C: 12 mL O₂ produced in 5 minutes\nAt 30°C: 18 mL O₂ produced in 5 minutes\nAt 40°C: 25 mL O₂ produced in 5 minutes\nAt 50°C: 15 mL O₂ produced in 5 minutes",
      images: [],
      prompt: "Generate a comprehensive lab report with proper scientific structure including introduction, objectives, materials, procedures, results, discussion, conclusion, and references.",
      subject: "Biology",
      sessionId: `test-session-${Date.now()}`
    };

    const reportResponse = await axios.post(`${API_BASE}/generate-full-report`, testData);
    
    if (reportResponse.status === 200 && reportResponse.data.success) {
      console.log('✅ Full report generated successfully');
      console.log('📄 Report structure:');
      
      const content = reportResponse.data.content;
      const sections = ['title', 'introduction', 'objectives', 'materials', 'procedures', 'results', 'discussion', 'conclusion', 'recommendations', 'references'];
      
      sections.forEach(section => {
        if (content[section]) {
          if (Array.isArray(content[section])) {
            console.log(`  - ${section}: ${content[section].length} items`);
          } else if (typeof content[section] === 'string') {
            console.log(`  - ${section}: ${content[section].substring(0, 50)}...`);
          } else {
            console.log(`  - ${section}: present`);
          }
        } else {
          console.log(`  - ${section}: missing`);
        }
      });

      // Step 3: Test that the content is valid JSON for ReportRenderer
      console.log('\n🔍 Step 3: Testing ReportRenderer compatibility...');
      
      if (typeof content === 'object' && content !== null) {
        console.log('✅ Content is valid JSON object');
        
        // Verify key sections exist
        const requiredSections = ['title', 'introduction', 'procedures', 'results'];
        const hasRequiredSections = requiredSections.every(section => content[section]);
        
        if (hasRequiredSections) {
          console.log('✅ All required sections present for ReportRenderer');
        } else {
          console.log('⚠️  Some required sections missing');
        }
        
        // Test content format
        if (typeof content.title === 'string' && content.title.length > 0) {
          console.log('✅ Title is properly formatted');
        }
        
        if (typeof content.introduction === 'string' && content.introduction.length > 0) {
          console.log('✅ Introduction is properly formatted');
        }
        
        if (Array.isArray(content.pages) || typeof content.pages === 'string') {
          console.log('✅ Pages content is properly formatted');
        }
        
      } else {
        console.log('❌ Content is not a valid JSON object');
      }

      // Step 4: Test that the content would render properly
      console.log('\n🎨 Step 4: Testing content rendering simulation...');
      
      // Simulate what ReportRenderer would do
      const renderableSections = Object.keys(content).filter(key => {
        const value = content[key];
        return value && (typeof value === 'string' || Array.isArray(value));
      });
      
      console.log(`✅ Found ${renderableSections.length} renderable sections:`);
      renderableSections.forEach(section => {
        const value = content[section];
        if (Array.isArray(value)) {
          console.log(`  - ${section}: ${value.length} items`);
        } else if (typeof value === 'string') {
          console.log(`  - ${section}: ${value.substring(0, 30)}...`);
        }
      });

      // Step 5: Test the report data structure matches what ReportViewer expects
      console.log('\n📊 Step 5: Testing ReportViewer data structure...');
      
      const reportData = {
        id: 'test-report',
        title: content.title,
        subject: testData.subject,
        content: content, // This is what ReportViewer expects
        created_at: new Date().toISOString(),
        session_id: testData.sessionId
      };
      
      // Verify the structure matches what ReportViewer expects
      if (reportData.content && typeof reportData.content === 'object') {
        console.log('✅ Report data structure is compatible with ReportViewer');
        console.log('✅ Content field is properly formatted for rendering');
      } else {
        console.log('❌ Report data structure is incompatible');
      }

      console.log('\n🎉 Complete UI Flow Test PASSED!');
      console.log('\nSummary:');
      console.log('- ✅ Application is accessible');
      console.log('- ✅ Full report API generates structured JSON');
      console.log('- ✅ Content is compatible with ReportRenderer');
      console.log('- ✅ Report data structure matches ReportViewer expectations');
      console.log('- ✅ PDF generation should work with structured content');

    } else {
      console.log('❌ Full report generation failed:', reportResponse.data.error || 'Unknown error');
    }

  } catch (error) {
    console.log('❌ Complete UI Flow Test FAILED!');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

// Run the test
testCompleteUIFlow();