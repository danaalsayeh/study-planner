# study-planner

A smart study planning website that helps students organize assignments, manage deadlines, and generate personalized study schedules using n8n automation.

Compatible with **GitHub Pages** using 100% vanilla HTML5, CSS3, and modern JavaScript.

---

## 🎨 Features

- **Modern Soft Lavender & White Dashboard**: Clean, aesthetic interface with rounded cards, subtle shadows, and responsive layout.
- **Student Login & Profiles**: Allows students to log in, switch demo accounts, and save their profile in the browser.
- **Assignment & To-Do Tracking**:
  - Add assignments with course/subject, deadline date & time, estimated study hours, and priority level (High, Medium, Low).
  - Mark assignments as completed or delete them with one click.
  - Due date countdown badges (e.g., *Due Today*, *Due in X days*, *Overdue*).
- **Live Statistics & Progress**:
  - Total, Pending, and Completed assignment counters.
  - Estimated study hours remaining.
  - Animated completion percentage progress bar.
- **Search, Filter & Sorting**:
  - Filter by All, Pending, Completed, or Due Soon.
  - Real-time search by task or course name.
  - Sort by deadline (soonest/latest), priority, or study duration.
- **Local Persistence**: Automatically saves all assignments and profile information in `localStorage` so data stays after refreshing.
- **Smart Study Plan**: Interactive timetable generation that creates a balanced study schedule based on deadlines and focus hours.

---

## 📁 Project Structure

```text
study-planner/
├── index.html       # The main application layout, form, statistics cards, and modals
├── style.css        # Soft lavender & white styling, typography, responsive grids, and animations
├── script.js        # Vanilla JS handling localStorage, CRUD, filters, statistics, and smart plan logic
└── README.md        # Project documentation and guide
```

---

## 🚀 How to Preview and Test Locally

You do not need to install any heavy dependencies or run a complex backend! Here are 3 easy ways:

### Option 1: Direct Browser Launch (Easiest)
1. Navigate to your project folder: `c:\Users\danaa\study-planner`.
2. Double-click **`index.html`** (or right-click -> **Open with Google Chrome / Edge / Firefox**).
3. The study planner will launch instantly!

### Option 2: Using VS Code / IDE Live Server
If you use VS Code:
1. Open the `study-planner` folder.
2. Install the **Live Server** extension.
3. Click **"Go Live"** in the bottom status bar or right-click `index.html` and select **"Open with Live Server"**.

### Option 3: Using Python HTTP Server (Terminal)
If Python is installed on your computer:
```bash
python -m http.server 8000
```
Then open [http://localhost:8000](http://localhost:8000) in your web browser.

---

## 🤖 Future n8n Automation Roadmap

When you are ready to connect n8n:
1. Set up a **Webhook Trigger** node in your n8n workflow.
2. Receive the pending assignments JSON payload from this planner.
3. Use an AI node (or algorithmic logic) to distribute study blocks across the student's calendar.
4. Send notifications or integrate with Google Calendar / Notion.
