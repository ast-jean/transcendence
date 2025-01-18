function handleProfileFormSubmit(event) {
    event.preventDefault(); // Prevent default form submission
    const form = event.target;

    const formData = new FormData(form);

    fetch('/update-profile/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest', // Optional for better handling in views
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Profile updated successfully!");
            } else {
                alert("Failed to update profile: " + data.error);
            }
        })
        .catch(error => console.error("Error updating profile:", error));
}

function handlePasswordFormSubmit(event) {
    event.preventDefault();
    const form = event.target;

    const formData = new FormData(form);

    fetch('/change-password/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Password changed successfully!");
            } else {
                alert("Failed to change password: " + data.error);
            }
        })
        .catch(error => console.error("Error changing password:", error));
}
