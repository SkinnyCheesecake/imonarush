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

