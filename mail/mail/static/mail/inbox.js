document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => write_email());

  // By default, load the inbox
  load_mailbox('inbox');
});

function reply_email() {
  const mailId = document.querySelector(".button-reply").id;

  fetch(`/emails/${mailId}`)
    .then(mail => mail.json())
    .then(mail => {
      document.querySelector('#compose-recipients').value = mail.sender;
      document.querySelector('#compose-subject').value = `Re: ${mail.subject}`;
      document.querySelector('#compose-body').value = `On ${mail.timestamp} ${mail.sender} wrote: "${mail.body}"`;
      compose_email();
    })

}

function write_email() {

  // Show compose view and hide other views

  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  compose_email();
}

function compose_email() {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';


  document.querySelector(".btn-primary").addEventListener
    ("click", function () {
      const recipients = document.querySelector("#compose-recipients").value;
      const subject = document.querySelector("#compose-subject").value;
      const body = document.querySelector("#compose-body").value;
      sendEmail(recipients, subject, body);
    }, { once: true });
}


function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  const emailsList = document.querySelector("#emails-view");
  emailsList.innerHTML = ""; // Clear the content

  getEmails(mailbox);

}


function sendEmail(recipients, subject, body) {
  // event.preventDefault();
  document.querySelector("form").addEventListener("click", function (event) {
    event.preventDefault();
  });

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      "recipients": recipients,
      "subject": subject,
      "body": body
    })
  })
    .catch(error => {
      console.error('Error sending email:', error);
    })
    .then(response => {
      response.json()
        .then(response => {
          // window.location.href = '/emails/sent';
          load_mailbox("sent");
        });
    });
}


function getEmails(mailbox) {
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      const emailsList = document.querySelector("#emails-view");
      emailsList.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
      emails.forEach(email => {
        const flexDiv = document.createElement('div');
        flexDiv.style.display = "grid";
        flexDiv.style.gridTemplateColumns = "1fr 11fr";
        emailsList.appendChild(flexDiv);

        // Button to archive
        if (mailbox === "inbox" || mailbox === "archive") {
          const buttonArchive = document.createElement('button')
          buttonArchive.id = email.id;
          if (mailbox === "inbox") {
            buttonArchive.innerHTML = "archive";
          }
          else {
            buttonArchive.innerHTML = "restore";
          }
          buttonArchive.classList.add("btn", "btn-sm", "btn-outline-primary");
          buttonArchive.classList.add("btn-archive");
          buttonArchive.style.marginRight = "1rem";
          flexDiv.appendChild(buttonArchive);
        }

        else {
          flexDiv.style.display = "block";
        }

        const divItem = document.createElement('div');
        divItem.id = email.id;
        divItem.classList.add("email-item");
        flexDiv.appendChild(divItem);


        const divMail = document.createElement('div');
        divItem.appendChild(divMail);


        // Paragraph for the sender
        const sender = document.createElement('h6');
        sender.classList.add("sender");
        if (mailbox === "inbox" || mailbox === "archive") {
          sender.textContent = email.sender;
        }
        else {
          sender.textContent = email.recipients;
        }
        divMail.appendChild(sender);

        // Heading for the subject
        const heading = document.createElement('p');
        heading.classList.add("heading");
        heading.textContent = email.subject;
        divMail.appendChild(heading);

        // Paragraph for the timestamp
        const timestamp = document.createElement('p');
        timestamp.classList.add("timestamp");
        timestamp.textContent = `Timestamp: ${email.timestamp}`;
        divItem.appendChild(timestamp);
        applyStylesBasedOnScreenWidth()

        divItem.style.border = '1px solid #ccc';
        divItem.addEventListener('mouseenter', () => {
          divItem.style.cursor = 'pointer';
        });

        divItem.addEventListener('mouseleave', () => {
          divItem.style.cursor = "default";
        });

        divMail.style.display = 'flex';
        divMail.style.alignItems = 'center';
        sender.style.margin = '0rem';
        heading.style.margin = '0rem';
        timestamp.style.margin = '0rem';
        sender.style.marginRight = '3rem';

        // Sort of media query
        function applyStylesBasedOnScreenWidth() {
          const screenWidth = window.innerWidth;

          if (screenWidth <= 767) {
            divItem.style.display = "block";
            divMail.style.justifyContent = "center";
            divMail.style.textAlign = "center";
            timestamp.style.textAlign = 'center';


          } else {
            divItem.style.display = "flex";
            divItem.style.justifyContent = 'space-between';
            divItem.style.alignItems = 'center';
            divItem.style.padding = '.5rem 0.5rem';
          }
        }

        // change sttle when resize
        window.addEventListener("resize", applyStylesBasedOnScreenWidth);

        if (email.read === true) {
          divItem.style.backgroundColor = "#f4f4f4";
        };

      });

      document.querySelectorAll('.email-item').forEach(emailItem => {
        emailItem.addEventListener('click', () => {
          const emailId = emailItem.id;
          displayEmailContent(emailId);
        });

        if (mailbox === "inbox" || mailbox === "archive") {
          document.querySelectorAll(".btn-archive").forEach(button => {
            button.addEventListener('click', () => {
              const emailId = button.id;
              if (mailbox === "inbox") {
                fetch(`/emails/${emailId}`, {
                  method: 'PUT',
                  body: JSON.stringify({ "archived": true })
                })
                  .then(response => {
                    location.reload();
                  })
              }
              else {
                fetch(`/emails/${emailId}`, {
                  method: 'PUT',
                  body: JSON.stringify({ "archived": false })
                })
                  .then(response => {
                    location.reload();
                  })
              }
            });
          });
        }
      });
    })
}


function displayEmailContent(emailId) {
  const head = document.querySelector("#emails-view");
  head.innerHTML = "";
  fetch(`/emails/${emailId}`)
    .then(response => response.json())
    .then(email => {

      const from = document.createElement('p');
      from.innerHTML = `<span>From: </span>${email.sender}`;
      head.appendChild(from);

      const to = document.createElement('p');
      to.innerHTML = `<span>To: </span>${email.recipients}`;
      head.appendChild(to);

      const subject = document.createElement('p');
      subject.innerHTML = `<span>Subject: </span>${email.subject}`;
      head.appendChild(subject);

      const timestamp = document.createElement('p');
      timestamp.innerHTML = `<span>Timestamp: </span>${email.timestamp}`;
      head.appendChild(timestamp);


      const spanElements = head.querySelectorAll('span');
      spanElements.forEach(span => {
        span.style.fontWeight = "bold";
      });

      const button = document.createElement('a');
      button.innerHTML = "Reply";
      head.appendChild(button);
      button.id = emailId;
      button.classList.add("btn", "btn-sm", "btn-outline-primary", "button-reply");
      button.addEventListener("click", reply_email)

      head.appendChild(document.createElement("hr"));

      const body = document.createElement('p');
      body.innerHTML = email.body;
      head.appendChild(body);


      fetch(`/emails/${emailId}`, {
        method: 'PUT',
        body: JSON.stringify({ "read": true })
      })
    });
}