document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.querySelectorAll("option:not([value=''])").forEach(o => o.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section
        const participantsHTML =
          details.participants && details.participants.length
            ? `<h5>Participants</h5>
               <ul class="participants-list">
                 ${details.participants
                   .map(
                     (p) =>
                       `<li class="participant-item"><span class="participant-email">${p}</span> <button class="participant-delete" data-activity="${name}" data-email="${p}" aria-label="Remove ${p}">\u00D7</button></li>`
                   )
                   .join("")}
               </ul>`
            : `<p class="no-participants">No participants yet</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Attach delete handlers for participant remove buttons
        activityCard.querySelectorAll(".participant-delete").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const activityName = btn.getAttribute("data-activity");
            const email = btn.getAttribute("data-email");

            // Optimistic UI: disable button while request runs
            btn.disabled = true;

            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
                { method: "POST" }
              );

              const data = await res.json();
              if (res.ok) {
                messageDiv.textContent = data.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");
                // Refresh list to reflect removal
                await fetchActivities();
              } else {
                messageDiv.textContent = data.detail || "Failed to remove participant";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                btn.disabled = false;
              }

              // Hide message after a short delay
              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 4000);
            } catch (err) {
              console.error("Error removing participant:", err);
              messageDiv.textContent = "Failed to remove participant. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              btn.disabled = false;
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities to show updated participants, then reset form
        await fetchActivities();
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
