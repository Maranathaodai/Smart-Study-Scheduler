const { scheduler } = require('./src/lib/scheduler');

async function testCalendarMultiCourse() {
  console.log('📅 Testing calendar multi-course display...');
  
  try {
    // Get current courses
    const courses = await scheduler.getCourses();
    console.log(`📚 Found ${courses.length} courses:`);
    
    courses.forEach((course, index) => {
      console.log(`   ${index + 1}. ${course.title} (${course.id})`);
    });
    
    // Get study sessions for a specific date
    const testDate = new Date();
    const dateStr = testDate.toISOString().split('T')[0];
    console.log(`\n📅 Checking sessions for ${dateStr}:`);
    
    const sessions = await scheduler.getStudySessionsForDate(testDate);
    console.log(`📖 Found ${sessions.length} study sessions:`);
    
    sessions.forEach((session, index) => {
      console.log(`   ${index + 1}. ${session.title} (Course: ${session.courseId})`);
    });
    
    // Check if we have sessions for multiple courses
    const uniqueCourseIds = [...new Set(sessions.map(s => s.courseId))];
    console.log(`\n🎨 Courses with sessions today: ${uniqueCourseIds.length}`);
    
    if (uniqueCourseIds.length > 1) {
      console.log('✅ Multiple courses have sessions - calendar should show different colors');
    } else if (uniqueCourseIds.length === 1) {
      console.log('⚠️ Only one course has sessions - calendar will show single color');
      console.log('💡 Need to create sessions for other courses to see multi-color display');
    } else {
      console.log('❌ No sessions found - calendar will be empty');
      console.log('💡 Need to create study sessions for courses');
    }
    
  } catch (error) {
    console.error('❌ Calendar test failed:', error.message);
  }
}

testCalendarMultiCourse();