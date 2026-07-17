"use client";
// import NavBar from "components/NavBar"
// import StudyCards from "../../components/StudyCards"

// export default function StudyPage() {
//      const courses = [
//         {
//             title: "Python",
//             description: "Learn Python",
//         },
//         {
//             title: "JavaScript",
//             description: "Learn JavaScript",
//         },
//         {
//             title: "React",
//             description: "Learn React",
//         },
//         ];
//   return (
//     <main>
//         <div>
//             <NavBar />
//         </div>
       
//         <div>
//             <h1>Study Page</h1>
//         </div>
//         <div>
//         {courses.map((course) => (
//         <StudyCards
//           key={course.title}
//           title={course.title}
//           description={course.description}
//         />
//       ))}
//         </div>

//     </main>
    
    
//   );
// }

// import NavBar from "components/NavBar"
// import StudyCards from "../../components/StudyCards"

// export default function StudyPage() {
//      const courses = [
//         {
//             title: "Python",
//             description: "Learn Python",
//         },
//         {
//             title: "JavaScript",
//             description: "Learn JavaScript",
//         },
//         {
//             title: "React",
//             description: "Learn React",
//         },
//         ];
//   return (
//     <main>
//         <div>
//             <NavBar />
//         </div>
       
//         <div>
//             <h1>Study Page</h1>
//         </div>
//         <div>
//         {courses.map((course) => (
//         <StudyCards
//           key={course.title}
//           title={course.title}
//           description={course.description}
//         />
//       ))}
//         </div>

//     </main>
    
    
//   );
// }



import { useState } from "react";

export default function StudyPage() {
  const [courseName, setCourseName] = useState("");
  const [description, setdescription] = useState("");
  const [courses, setCourses] = useState<{ title: string; description: string }[]
>([]);


  function addCourse() {
    setCourses([...courses, { title: courseName, description: description, },]);
    setCourseName("");
    setdescription("");}
    

  return (
    <main>
      <input
        value={courseName}
        onChange={(e) => setCourseName(e.target.value)}
      />
      <input
        value={description}
        onChange={(e) => setdescription(e.target.value)}
      />

      <button onClick={addCourse}>
        Add Course
      </button>

      {courses.map((course, index) => (
        <div key={index}>
            <h2>{course.title}</h2>
            <p>{course.description}</p>
        </div>
      ))}
      

    </main>
  );
}