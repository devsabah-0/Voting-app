// public/scripts/manage.js
document.addEventListener('DOMContentLoaded', () => {
    const pollForm = document.getElementById('poll-form');
    const pollSelector = document.getElementById('poll-selector');
    const participantManagement = document.getElementById('participant-management');
    const participantForm = document.getElementById('participant-form');
    const participantList = document.getElementById('participant-list');
    const toggleVotingButton = document.getElementById('toggle-voting');
    let currentPollId = null;

    const loadPolls = () => {
        fetch('/polls')
            .then(response => response.json())
            .then(data => {
                pollSelector.innerHTML = '<option value="">Select a poll to manage</option>';
                data.forEach(poll => {
                    const option = document.createElement('option');
                    option.value = poll.id;
                    option.textContent = poll.name;
                    pollSelector.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error loading polls:', error);
            });
    };

    const addPoll = (event) => {
        event.preventDefault();
        const pollName = document.getElementById('poll-name').value;

        fetch('/polls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: pollName })
        })
        .then(response => response.json())
        .then(() => {
            pollForm.reset();
            loadPolls();
        })
        .catch(error => {
            console.error('Error creating poll:', error);
        });
    };

    const loadParticipants = (pollId) => {
        fetch(`/polls/${pollId}/participants`)
            .then(response => response.json())
            .then(data => {
                participantList.innerHTML = '';
                data.forEach(participant => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <img src="${participant.imagePath}" alt="${participant.name}" class="participant-image">
                        ${participant.name} - ${participant.designation} (${participant.department})
                        <button class="delete-button" onclick="deleteParticipant(${pollId}, ${participant.id})">Delete</button>
                    `;
                    participantList.appendChild(li);
                });
            })
            .catch(error => {
                console.error('Error loading participants:', error);
            });
    };

    const addParticipant = (event) => {
        event.preventDefault();
        if (!currentPollId) return;

        const formData = new FormData(participantForm);
        fetch(`/polls/${currentPollId}/participants`, {
            method: 'POST',
            body: formData
        })
        .then(() => {
            loadParticipants(currentPollId);
        })
        .catch(error => {
            console.error('Error adding participant:', error);
        });
    };

    window.deleteParticipant = (pollId, participantId) => {
        fetch(`/polls/${pollId}/participants/${participantId}`, { method: 'DELETE' })
            .then(() => loadParticipants(pollId))
            .catch(error => {
                console.error('Error deleting participant:', error);
            });
    };

    const toggleVoting = () => {
        if (!currentPollId) return;

        fetch(`/polls/${currentPollId}/toggle-voting`, { method: 'PUT' })
            .then(response => response.json())
            .then(data => {
                toggleVotingButton.textContent = data.votingOpen ? 'Vote Stop' : 'Vote Start';
                toggleVotingButton.style.backgroundColor = data.votingOpen ? 'red' : 'green';
            })
            .catch(error => {
                console.error('Error toggling voting:', error);
            });
    };

    pollSelector.addEventListener('change', (event) => {
        currentPollId = event.target.value;
        if (currentPollId) {
            participantManagement.style.display = 'block';
            toggleVotingButton.style.display = 'inline-block';
            loadParticipants(currentPollId);
            fetch(`/polls/${currentPollId}`)
                .then(response => response.json())
                .then(data => {
                    toggleVotingButton.textContent = data.votingOpen ? 'Vote Stop' : 'Vote Start';
                    toggleVotingButton.style.backgroundColor = data.votingOpen ? 'red' : 'green';
                });
        } else {
            participantManagement.style.display = 'none';
            toggleVotingButton.style.display = 'none';
        }
    });

    pollForm.addEventListener('submit', addPoll);
    participantForm.addEventListener('submit', addParticipant);
    toggleVotingButton.addEventListener('click', toggleVoting);
    loadPolls();
});
