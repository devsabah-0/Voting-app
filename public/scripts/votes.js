// public/scripts/votes.js
document.addEventListener('DOMContentLoaded', () => {
    const pollsContainer = document.getElementById('polls-container');

    const loadPolls = () => {
        fetch('/polls')
            .then(response => response.json())
            .then(polls => {
                pollsContainer.innerHTML = '';
                polls.forEach(poll => {
                    const pollDiv = document.createElement('div');
                    pollDiv.className = 'poll';
                    pollDiv.innerHTML = `
                        <div class="poll-header">
                            <h2>${poll.name}</h2>
                            <button class="collapse-button" onclick="toggleParticipants(${poll.id})">+</button>
                        </div>
                        <div id="participants-${poll.id}" class="participants" style="display: none;"></div>
                    `;
                    pollsContainer.appendChild(pollDiv);
                });
            })
            .catch(error => {
                console.error('Error loading polls:', error);
            });
    };

    window.toggleParticipants = (pollId) => {
        const participantsDiv = document.getElementById(`participants-${pollId}`);
        const toggleButton = participantsDiv.previousElementSibling.querySelector('.collapse -button');
        if (participantsDiv.style.display === 'none') {
            loadParticipants(pollId);
            participantsDiv.style.display = 'block';
            toggleButton.textContent = '-';
        } else {
            participantsDiv.style.display = 'none';
            toggleButton.textContent = '+';
        }
    };

    const loadParticipants = (pollId) => {
        fetch(`/polls/${pollId}/participants`)
            .then(response => response.json())
            .then(participants => {
                const participantsDiv = document.getElementById(`participants-${pollId}`);
                participantsDiv.innerHTML = '';
                participants.forEach(participant => {
                    const participantCard = document.createElement('div');
                    participantCard.className = 'card';
                    participantCard.innerHTML = `
                        <img src="${participant.imagePath}" alt="${participant.name}" class="employee-pic">
                        <div class="employee-info">
                            <h2 class="employee-name">${participant.name}</h2>
                            <p class="designation">${participant.designation}</p>
                            <p class="department">${participant.department}</p>
                            <p class="review">${participant.review}</p>
                            <p class="vote-count">Votes: ${participant.votes}</p>
                        </div>
                    `;
                    participantsDiv.appendChild(participantCard);
                });
            })
            .catch(error => {
                console.error('Error loading participants:', error);
            });
    };

    loadPolls();
});
