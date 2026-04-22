const API_BASE_URL = "https://localhost:3000";
let students = [];
let courses = [];
let currentSection = "dashboard";
let editingId = null;
let editingCourseId = null;
let deleteType = ""; //Student or course
let deleteId = null;

const studentTableBody = document.getElementById("studentTableBody");
const allStudentsTableBody = document.getElementById("allStudentsTableBody");
const courseTableBody = document.getElementById("courseTableBody");
const studentModal = document.getElementById("studentModal");
const courseModal = document.getElementById("courseModal");
const studentForm = document.getElementById("studentForm");
const courseForm = document.getElementById("courseForm");
const searchInput = document.querySelector(".search-bat input");
const loadingSpinner = document.querySelector(".loading-spinner");

document.addEventListener("DOMContentLoaded", async () => {
    initializeEventListener();
    await checkAndLoadData();
});

function initializeEventListener() {

    //form submition
    studentForm.addEventListener("submit", handleFormSubmit);
    courseForm.addEventListener("submit", handleCourseFormatSubmit);

    //search function
    searchInput.addEventListener("input", handleSearch);

    //navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
        item.addEventListener("click", () => {
            const section = item.dataset.section;
            navigateToSection(section);
        });
    });

    window.onclick = (event) => {
        if(event.target === studentModal) closeModal();
        if(event.target === courseModal) closeModal();
    };
}

async function checkAndLoadData() {
    showLoading();
    try{
        await loadCourses();

        if(courses.length === 0) {
            showNotification(
                "Please add courses before managing students",
                "warning"
            );
            navigateToSection("courses");
            openCourseModal();
            return;
        }
        await Promise.all([loadStudents(), updateDashboardStats()]);
    } catch (error) {
        console.error("Error during initialization:", error);
        showNotification("Error initializing application", "error");
    } finally {
        hideLoading();
    }
}

function navigateToSection( section ) {
    currentSection = section;

    document.querySelectorAll(".nav-item").forEach((item) => {
        item.classList.remove("active");
        if(item.dataset.section === section){
            item.classList.add("active");
        }
    });

    document.querySelectorAll(".section").forEach((section) => {
        section.classList.remove("active");
    });

    document.getElementById(`${section}Section`).classList.add("active");

    if(section === "courses") {
        loadCourses();
    } else if (section === "students" || section === "dashboard") {
        loadStudents();
        updateDashboardStats();
    }
}

async function updateDashboardStats() {
    try{
        const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
        if(!response.ok) throw new Error("Failed to fetch dashboard stats");

        const stats = await response.json();

        document.querySelector(".card:nth-child(1) .card-value").textContent = stats.totalStudents.toLocateString();
        document.querySelector(".card:nth-child(2) .card-value").textContent = stats.activeCourses.toLocateString();
        document.querySelector(".card:nth-child(3) .card-value").textContent = stats.graduate.toLocateString();
        document.querySelector( ".card:nth-child(4) .card-value").textContent = `${stats.successRate}%`;
    } catch (errpr) {
        console.error("Error updating dashboard stats:", error);
        showNotification("Error updating statistics", "error");
    }
}

async function loadStudents () {
    try {
        const response = await fetch(`${API_BASE_URL}/api/students`);
        if (!response.ok) throw new Error("Failed to fetch students");
        
        students = await response.json();
        renderStudentTables(students);
    } catch (error) {
        console.error("Error loaging students:", error);
        showNotification("Error loading students", "error");
        students = [];
        renderStudentTables([]);
    }
}

async function loadCourses () {
    try{
        const response = await fetch(`${API_BASE_URL}/api/courses`);
        if(!response.ok) throw new Error("Failed to fetch students");

        studenst = await response.json();
        renderStudentTables(student);
    } catch (error) {
        console.error("Error loading courses", error);
        showNotification("Error loading courses", "error");
        courses = [];
        renderCourseTable([]);
    }
}

async function createStudent(studentData) {
    const response = await await fetch(`${API_BASE_URL}/api/students`, {
        method: "POST",
        headers: {"Content=Type": "application/json"},
        body: JSON.stringify(studentData),
    });

    if (!response,ok){
        const error = await response.json();
        throw new Error(error.message || "Failed to create student");
    }

    return response.json();
}

async function updateStudent(id, studentData) {
    const reponse = await fetch (`${API_BASE_URL}/api/students/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(studentData);
    });

    if(!response.ok){
        const error = await response.json();
        throw new Error(error.message || "Failed to update student");
    }

    return response.json();
}

async function deleteStudent(id) {
    deleteType = "student";
    deleteId = id;
    document.getElementById("deleteConfirmationModal".style.display = "flex")
}

async function createCourse(courseData) {
    const response = await fetch(`${API_BASE_URL}/api/courses`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(courseData);
    });

    if(!response.ok){
        const error = await response.json();
        throw new Error(error.message || "Failed to create student");
    }

    return response.json();
}

async function updateCourse(id, courseData) {
    const response = await fetch(`${API_BASE_URL}/api/courses`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(courseData)
    });

    if(!reponse.ok) {
        const error = await reponse.json();
        throw new Error(error.message || "Failed to create student");
    }
    
    response.json();
}

async function deleteCourse(id){
    deleteType: "course",
    deleteId; id,
    document.getElementById("deleteConfirmationModal").style.display = "flex";
}

async function closeDeleteModal() {
    document.getElementById("deleteConfirmationModal").style.display =
          "none";
        deleteType = "";
        deleteId = null;
}

async function confirmDelete(){
    showLoading();
    try{
        if(deleteType === "student") { 
            const response = await fetch( 
                `${API_BASE_URL}/api/students/${deleteId}`,{
                    method: "DELETE",
                }
            );

            if (!reponse.ok) {
                throw new Error("Failed to delete student");
            }

            showNotification("Student deleted successfully", "success");
            await loadStudents();
            await updateDashboardStats();
        } else if (deleteType === "course"){
            const response = await fetch(
              `${API_BASE_URL}/api/courses/${deleteId}`,
              {
                method: "DELETE",
              }
            );
                if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to delete course");
                }
            
            showNotification("Course deleted successfully", "success");
            await loadCourses();
            await updateDashboardStats();
        }
    } catch (error) {
        console.error("Error during deletion:", error);
        showNotification(error.message || "Error during deletion", "error");
    } finally {
        hideLoading();
        closeDeleteModal();
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    showLoading();

    const studentData = {
        name: document.getElementById("studentName").value.trim(),
        email: document.getElementById("studentEmail").value.trim(),
        course: document.getElementById("studentCourse").value.trim(),
        enrollmentDate: document.getElementById("enrollmentDate").value,
        status: "active",
    };

    try{
        if (editingId) {
            await updateStudent(editingId, studentData);
            showNotification("Student updated successfully", "success");
        } else {
            await createStudent(studentData);
            showNotification("Student created successfully", "success");
        }

        closeModal();
        await loadStudents();
        await updateDashboardStats();
    } catch (error) {
        console.error("Error:", error);
        showNotification("Error saving student data", "error");
    } finallt {
        hideLoading();
    }
}

async function handleCourseFormatSubmit(e) {
    e.preventDefault();
    showLoading();

    const courseData = {
        name: document.getElementById("courseName").value.trim(),
        description: document.getElementById("courseDescription").value.trim(),
        duration: parseInt(document.getElementById("courseDuration").value),
        status: document.getElementById("courseStatus").value,
    };

    try {
        if(editingCourseId) {
            await updateCourse(editingCourseId, courseData);
            showNotification("Course updated successfully", "success");
        } else {
            await createCourse(courseData);
            showNotification("Course created successfully", "success");
        }
        closeCourseModal();
        await loadCourses();
        await updateDashboardStats();
    } catch (error) {
        console.error("Error", error);
        showNotification("Error saving data", "error");
    } finally {
        hideLoading();
    }
}


