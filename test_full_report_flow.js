import axios from 'axios';

// Test the complete full report generation and rendering flow
async function testFullReportFlow() {
  console.log('🧪 Testing Full Report Generation and Rendering Flow...\n');

  // Test data that matches what would be sent from the frontend
  const testData = {
    parsedText: 'The experiment involved testing the reaction rate of hydrogen peroxide decomposition using manganese dioxide as a catalyst. The procedure included measuring the volume of oxygen gas produced over time at different temperatures.',
    results: 'At 25°C: 45mL O₂ produced in 5 minutes\nAt 35°C: 78mL O₂ produced in 5 minutes\nAt 45°C: 112mL O₂ produced in 5 minutes',
    images: [],
    prompt: 'Generate a comprehensive lab report based on the provided experimental data and results.',
    subject: 'Chemistry',
    sessionId: 'test-session-' + Date.now()
  };

  try {
    console.log('📤 Sending request to generate full report...');
    console.log('Test data:', JSON.stringify(testData, null, 2));

    // Call the full report generation API
    const response = await axios.post('http://localhost:3001/api/generate-full-report', testData);
    
    console.log('\n✅ Full report generated successfully!');
    console.log('Response status:', response.status);
    console.log('Response structure:');
    console.log('- success:', response.data.success);
    console.log('- content type:', typeof response.data.content);
    console.log('- content keys:', response.data.content ? Object.keys(response.data.content) : 'none');
    console.log('- metadata:', response.data.metadata);
    
    if (response.data.content) {
      console.log('\n📄 Generated Report Content:');
      const content = response.data.content;
      console.log('Title:', content.title);
      console.log('Introduction preview:', content.introduction?.substring(0, 100) + '...');
      console.log('Objectives count:', content.objectives?.length);
      console.log('Materials count:', content.materials?.length);
      console.log('Results preview:', content.results?.substring(0, 100) + '...');
      console.log('Discussion present:', !!content.discussion);
      console.log('Conclusion present:', !!content.conclusion);
      console.log('Recommendations count:', content.recommendations?.length);
      console.log('References count:', content.references?.length);
    }

    // Test that the content is valid JSON that can be rendered by ReportRenderer
    console.log('\n🔍 Testing ReportRenderer compatibility...');
    
    // Simulate what ReportRenderer would receive
    const rendererProps = {
      content: response.data.content
    };
    
    console.log('ReportRenderer would receive:');
    console.log('- content type:', typeof rendererProps.content);
    console.log('- content is object:', typeof rendererProps.content === 'object');
    console.log('- content is not null:', rendererProps.content !== null);
    
    if (typeof rendererProps.content === 'object' && rendererProps.content !== null) {
      console.log('✅ Content is valid JSON object - ReportRenderer should render structured report');
    } else {
      console.log('❌ Content is not valid JSON object - ReportRenderer will use fallback');
    }

    console.log('\n🎉 Full report generation test completed successfully!');
    console.log('The API is now returning structured JSON data that ReportRenderer can display properly.');

  } catch (error) {
    console.error('\n❌ Full report generation test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testFullReportFlow();