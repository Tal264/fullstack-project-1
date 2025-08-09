const USERS_URL = 'https://jsonplaceholder.typicode.com/users';
const TODOS_URL = 'https://jsonplaceholder.typicode.com/todos';
const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';

let users = [];

// get users data from API service and populate it in the user cards
async function getUser() {
  const resp = await fetch(USERS_URL);
  users = await resp.json();

  const userList = document.getElementById("usercard");
  userList.innerHTML = '';

  users.forEach(user => {
    const userCard = document.createElement('div');
    userCard.className = 'user-card';
    userCard.id = `user-${user.id}`;

    const idField = `
    <div class="user-id">
    <label onclick="selectUser(${user.id})"> ID: ${user.id}</label>
    </div>`;

    const nameField = `
      <div class="input-row">
        <strong>Name:</strong>
        <input type="text" name="username" value="${user.name}" />
      </div>`;
    const emailField = `
      <div class="input-row">
        <strong>Email:</strong>
        <input type="text" name="email" value="${user.email}" />
      </div>`;

    const otherDataBtn = `<button class="other-data-btn">Other Data</button>`;

    const addressBox = `
  <div class="address-box" style="display: none;">
    <div class="input-row"><strong>Street:</strong><input type="text" value="${user.address.street}" /></div>
    <div class="input-row"><strong>City:</strong><input type="text" value="${user.address.city}" /></div>
    <div class="input-row"><strong>Zip:</strong><input type="text" value="${user.address.zipcode}" /></div>
  </div>
`;


    const actionButtons = `
      <div class="action-buttons">
        <button onclick="updateUser(${user.id})">Update</button>
        <button onclick="deleteUser(${user.id})">Delete</button>
      </div>
    `;

    userCard.innerHTML = idField + nameField + emailField + otherDataBtn + addressBox + actionButtons;

    user.element = userCard;
    userList.appendChild(userCard);

    // other data button function 
    const otherDataButton = userCard.querySelector('.other-data-btn');
    const addressBoxDiv = userCard.querySelector('.address-box');

    otherDataButton.addEventListener('mouseenter', () => {
      addressBoxDiv.style.display = 'block';
    });

    otherDataButton.addEventListener('click', () => {
      const isVisible = addressBoxDiv.style.display === 'block';
      addressBoxDiv.style.display = isVisible ? 'none' : 'block';
    });

  
addressBoxDiv.addEventListener('click', (event) => {
  // Check if the clicked element is *not* inside an input-row
  if (!event.target.closest('.input-row')) {
    addressBoxDiv.style.display = 'none';
  }
});

  });
}

// todos - color the user cards borders 
async function getTodos() {
  const resp = await fetch(TODOS_URL);
  const todos = await resp.json();

  users.forEach(user => {
    const userTodos = todos.filter(todo => todo.userId === user.id);
    const hasUncompleted = userTodos.some(todo => !todo.completed);

    const userDiv = document.getElementById(`user-${user.id}`);
    if (userDiv) {
      userDiv.style.border = hasUncompleted ? '2px solid red' : '2px solid green';
    }
  });
}

// search 
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector("[data-search]");
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      const value = e.target.value.toLowerCase();
      users.forEach(user => {
        const isVisible = user.name.toLowerCase().includes(value) || user.email.toLowerCase().includes(value);
        user.element.classList.toggle("hide", !isVisible);
      });
    });
  }
});

// user update function - activated on click
async function updateUser(userId) {
  const userCard = document.getElementById(`user-${userId}`);
  const nameInput = userCard.querySelector('input[name="username"]');
  const emailInput = userCard.querySelector('input[name="email"]');

  const updatedName = nameInput.value;
  const updatedEmail = emailInput.value;

  const userData = { name: updatedName, email: updatedEmail };

  const resp = await fetch(`${USERS_URL}/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  const data = await resp.json();
  console.log('User updated:', data);
}

// user delete function - activated on click
async function deleteUser(userId) {
  const resp = await fetch(`${USERS_URL}/${userId}`, {
    method: 'DELETE',
  });

  if (resp.ok) {
    console.log(`User ${userId} deleted successfully`);
    // remove user card from DOM:
    const userCard = document.getElementById(`user-${userId}`);
    if (userCard) userCard.remove();
  } else {
    console.error(`Failed to delete user ${userId}`);
  }
}

// select user - activated on click
async function selectUser(userId) {
  const resp = await fetch(`${USERS_URL}/${userId}`);
  const user = await resp.json();
  console.log(`User ${user.id} selected:`, user);

  users.forEach(u => {
    const userCard = document.getElementById(`user-${u.id}`);
    if (userCard) {
      userCard.style.backgroundColor = u.id === userId ? 'orange' : '';
    }
  });
  userTodos(userId);
  userPosts(userId);
}

// create a todo item DOM element for a todo object
function createTodoItemElement(todo) {
  const todoItem = document.createElement('div');
  todoItem.classList.add('user-todo-item');

  todoItem.innerHTML = `
    <div class="user-todos">
      <div class="title"><strong>Title:</strong> ${todo.title}</div>
      <div class="completed"><strong>Completed:</strong> <span class="completed-status">${todo.completed}</span></div>
      ${!todo.completed ? `<div class="mark-completed-btn"><button>Mark Completed</button></div>` : ''}
    </div>
  `;

  if (!todo.completed) {
    const markCompletedBtn = todoItem.querySelector('.mark-completed-btn');
    const completedStatus = todoItem.querySelector('.completed-status');

    markCompletedBtn.addEventListener('click', async () => {
      // Simulate API PATCH request
      await fetch(`${TODOS_URL}/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });

      // Update local state
      todo.completed = true;
      completedStatus.innerText = 'true';
      markCompletedBtn.remove();

      // Update border color based on remaining uncompleted todos
      const userId = todo.userId;
      const userCard = document.getElementById(`user-${userId}`);

      // Find all todo elements under this user
      const todoItems = document.querySelectorAll(`#todosCard .user-todo-item .completed-status`);
      const allCompleted = Array.from(todoItems).every(span => span.innerText === 'true');

      if (userCard) {
        userCard.style.border = allCompleted ? '2px solid green' : '2px solid red';
      }
    });
  }

  return todoItem;
}


// create a post item DOM element for a post object
function createPostItemElement(post) {
    const postItem = document.createElement('div');
    postItem.classList.add('user-post-item');
  
    postItem.innerHTML = `
      <div class="user-posts">
        <div class="title"><strong>Title:</strong> ${post.title}</div>
        <div class="body"><strong>Body:</strong> ${post.body}</span> </div>
      </div>
    `;
  
        // // Simulate a server update
        // fetch(`${POSTS_URL}/${post.id}`, {   
        //   method: 'PATCH',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ completed: true }),
        // });
        return postItem;
   };

// create todos container
async function userTodos(userId) {
  // Fetch todos for the given userId
  const resp = await fetch(`${TODOS_URL}?userId=${userId}`);
  const todos = await resp.json();

  // Get the container div where todos will be displayed
  const todosContainer = document.getElementById('todosCard');
  
  // Clear previous todos from the container and show it
  todosContainer.innerHTML = '';
  todosContainer.style.display = 'block';

  // Create wrapper for label and button
  const headerDiv = document.createElement('div');
  headerDiv.className = 'todos-header';

  // Create and append a label displaying the user ID
  const idLabel = document.createElement('label');
  idLabel.innerText = `Todos - ID: ${userId}`;
  headerDiv.appendChild(idLabel);

  // Create add button
  const addTodoBtn = document.createElement('button');
  addTodoBtn.id = 'addTodoBtn';
  addTodoBtn.textContent = 'Add';
  headerDiv.appendChild(addTodoBtn);

  
  // Create a container to hold the list of todos and  Append the header to the container
  const todoListContainer = document.createElement('div');
  todoListContainer.id = 'todoListContainer';
  todosContainer.appendChild(todoListContainer);
  todoListContainer.appendChild(headerDiv);

  // Add click handler to add button
  addTodoBtn.addEventListener('click', () => addTodo(userId));

  // Add each todo to the todoListContainer
  todos.forEach(todo => {
    const todoItem = createTodoItemElement(todo);
    todoListContainer.appendChild(todoItem);
  });
}


// create post container
async function userPosts(userId) {
  // Fetch posts for the given userId
  const resp = await fetch(`${POSTS_URL}?userId=${userId}`);
  const posts = await resp.json();

  // create a main container div where posts will be displayed
  const postsContainer = document.getElementById('postsCard');
  // Clear previous posts from the container
  postsContainer.innerHTML = '';
  postsContainer.style.display = 'block';

  // Create wrapper for label and button
  const headerDiv = document.createElement('div');
  headerDiv.className = 'posts-header';

  // Create and append a label displaying the user ID
  const idLabel = document.createElement('label');
  idLabel.innerText = `Posts - ID: ${userId}`;
  headerDiv.appendChild(idLabel);

  // Create add button
  const addPostBtn = document.createElement('button');
  addPostBtn.id = 'addPostBtn';
  addPostBtn.textContent = 'Add';
  headerDiv.appendChild(addPostBtn);

  // Append the header to the container
  postsContainer.appendChild(headerDiv);

  // create a list container inside the main container
    const postListContainer = document.createElement('div');
    postListContainer.id = 'postListContainer';
    postsContainer.appendChild(postListContainer);
    postListContainer.appendChild(headerDiv);


  // Loop through each post and create HTML elements
  posts.forEach(post => {
    const postItem = document.createElement('div');
    postItem.classList.add('user-post-item');

    postItem.innerHTML = `
      <div class="user-posts">
        <div class="title"><strong>Title:</strong> ${post.title}</div><br>
        <div class="body"><strong>Body:</strong> ${post.body}</div>
      </div>
    `;

    postListContainer.appendChild(postItem);
  });
  // Add click handler to add button
  addPostBtn.addEventListener('click', () => addPost(userId));

  // Add each Post to the postListContainer
  posts.forEach(post => {
    const postItem = createPostItemElement(post);
    postListContainer.appendChild(postItem);
  });
}

// add new todo
async function addTodo(userId) {
  const todosContainer = document.getElementById('todosCard');
  const todoListContainer = document.getElementById('todoListContainer');

  // Remove existing form if any
  const existingForm = document.getElementById('todoFormContainer');
  if (existingForm) existingForm.remove();

  // Hide the list container while form is visible
  if (todoListContainer) {
    todoListContainer.style.display = 'none';
  }

  // Create a container for the add todo form
  const formContainer = document.createElement('div');
  formContainer.id = 'todoFormContainer';
  formContainer.className = 'form-container';

  formContainer.innerHTML = `
    <label>New Todo - ID: ${userId}</label> 
    <div class="input-row">
      <strong>Title: </strong>
      <input type="text" id="newTodoInput" />
    </div>
    <div class="form-buttons">
      <button id="cancelTodoBtn">Cancel</button>
      <button id="addTodoBtnConfirm">Add</button>
    </div>
  `;

  // Insert form container right after the header but before todo list container
  const headerDiv = todosContainer.querySelector('.todos-header');
  todosContainer.insertBefore(formContainer, todoListContainer);

  const todoInput = document.getElementById('newTodoInput');
  const addTodoBtnConfirm = document.getElementById('addTodoBtnConfirm');
  const cancelTodoBtn = document.getElementById('cancelTodoBtn');

  // Add handler for Add button inside the form
  addTodoBtnConfirm.addEventListener('click', async () => {
    const newTitle = todoInput.value.trim();
    if (!newTitle) return alert('Todo cannot be empty.');

    const newTodo = {
      userId,
      title: newTitle,
      completed: false,
    };

    const resp = await fetch(`${TODOS_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTodo),
    });

    const data = await resp.json();
    console.log('Todo added:', data);

    // Append new todo item dynamically to todoListContainer
    const newTodoElement = createTodoItemElement(data);
    todoListContainer.appendChild(newTodoElement);

    // Remove the form and show the list again
    formContainer.remove();
    todoListContainer.style.display = 'block';
  });

  // Cancel handler removes the form without refreshing the list
  cancelTodoBtn.addEventListener('click', () => {
    formContainer.remove();
    todoListContainer.style.display = 'block';
  });
}


// add new post
async function addPost(userId) {
    const postContainer = document.getElementById('postsCard');
    const postListContainer = document.getElementById('postListContainer');

    // Remove existing form if any
    const existingForm = document.getElementById('postFormContainer');
    if (existingForm) existingForm.remove();

   // hide the list container while form is visible
      if (postListContainer) postListContainer.style.display = 'none';
                
  
    // Create a container for the add post form
    const formContainer = document.createElement('div');
    formContainer.id = 'postFormContainer';
    formContainer.className = 'form-container';
  
    formContainer.innerHTML = `
      <label>New Post - ID: ${userId}</label> 
      <div class="input-row">
       <strong>Title: </strong>
        <input type="text" id="newPostTitleInput"  /> 
         </div>
        <div class="input-row">
        <strong>Body: </strong>
        <input type="text" id="newPostBodyInput" />
        </div>
      <div class="form-buttons">
        <button id="cancelPostBtn">Cancel</button>
        <button id="addPostBtn">Add</button>
      </div>
      
    `;
  
    // Insert form container right after the header but before post list container
    const headerDiv = postContainer.querySelector('.posts-header');
    postContainer.insertBefore(formContainer, postListContainer);
  
    const titleInput = document.getElementById('newPostTitleInput');
    const bodyInput = document.getElementById('newPostBodyInput');
    const addPostBtn = document.getElementById('addPostBtn');
    const cancelPostBtn = document.getElementById('cancelPostBtn');
  
    // Add handler for Add button
    addPostBtn.addEventListener('click', async () => {
      const newTitle = titleInput.value.trim();
      const newBody = bodyInput.value.trim();
      if (!newTitle || !newBody) return alert('Field cannot be empty.');
  
      const newPost = {
        userId,
        title: newTitle,
        body: newBody,
      };
  
      const resp = await fetch(`${POSTS_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
  
      const data = await resp.json();
      console.log('Post added:', data);
  
      // Append new post item dynamically to postListContainer
      const newPostElement = createPostItemElement(data);
      postListContainer.appendChild(newPostElement);
      // Remove the form
      formContainer.remove();
      postListContainer.style.display = 'block';
    });
  
    // Cancel handler removes the form without refreshing the list
    cancelPostBtn.addEventListener('click', () => {
      formContainer.remove();
      postListContainer.style.display = 'block';
    });
  }


// Function to create and show the Add User form
function showAddUserForm() {
  const existingForm = document.getElementById('addUserForm');
  if (existingForm) existingForm.remove(); // remove old form

  const formContainer = document.createElement('div');
  formContainer.id = 'addUserForm';
  formContainer.className = 'form-container';

  formContainer.innerHTML = `
    <div class="formHeader"><label>New User</label></div>
    <div class="input-row"><strong>Name:</strong><input type="text" id="newUserName" /></div>
    <div class="input-row"><strong>Email:</strong><input type="text" id="newUserEmail" /></div>
    <div class="form-buttons">
      <button type="button" id="cancelAddUserBtn">Cancel</button>
      <button type="button" id="confirmAddUserBtn">Add</button>
    </div>
  `;

  const formWrapper = document.getElementById('formContainerWrapper');
  formWrapper.innerHTML = ''; // clear previous
  formWrapper.appendChild(formContainer);

  // Cancel button
  document.getElementById('cancelAddUserBtn').addEventListener('click', () => {
    formContainer.remove();
  });

  // Confirm Add button
  document.getElementById('confirmAddUserBtn').addEventListener('click', () => {
    const name = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();

    if (!name || !email) {
      alert('Name and Email are required');
      return;
    }

    const newUser = {
      id: Date.now(), // unique id
      name,
      email
    };

    addUser(newUser); // Add user to UI
    formContainer.remove(); // close form
  });
}

// Append user card to UI
function addUser(user) {
  const userCardContainer = document.getElementById('usercard');

  const card = document.createElement('div');
  card.className = 'user-card';
  card.innerHTML = `
    <p class="user-id">ID: ${user.id}</p>
    <p><strong>Name:</strong> ${user.name}</p>
    <p><strong>Email:</strong> ${user.email}</p>
  `;

  userCardContainer.appendChild(card);
}


// Trigger form on Add button click
document.getElementById('userAddBtn').addEventListener('click', showAddUserForm);

  
// add a user 
async function addUser(userData) {
  const resp = await fetch(USERS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: userData.name,
      email: userData.email,
      address: {
        street: 'N/A',
        city: 'N/A',
        zipcode: 'N/A'
      }
    }),
  });

  const newUser = await resp.json();

  // Simulate a new ID if API doesn't provide a unique one
  if (!newUser.id) {
    newUser.id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
  }

  // Add element for search filter
  const userCard = document.createElement('div');
  userCard.className = 'user-card';
  userCard.id = `user-${newUser.id}`;

  userCard.innerHTML = `
    <div class="user-id">
      <label onclick="selectUser(${newUser.id})">ID: ${newUser.id}</label>
    </div>
    <div class="input-row"><strong>Name:</strong><input type="text" name="username" value="${newUser.name}" /></div>
    <div class="input-row"><strong>Email:</strong><input type="text" name="email" value="${newUser.email}" /></div>
    <button class="other-data-btn">Other Data</button>
    <div class="address-box" style="display: none;">
      <div class="input-row"><strong>Street:</strong><input type="text" value="N/A" /></div>
      <div class="input-row"><strong>City:</strong><input type="text" value="N/A"  /></div>
      <div class="input-row"><strong>Zip:</strong><input type="text" value="N/A"  /></div>
    </div>
    <div class="action-buttons">
      <button onclick="updateUser(${newUser.id})">Update</button>
      <button onclick="deleteUser(${newUser.id})">Delete</button>
    </div>
  `;

  // Add event listeners for Other Data button
  const otherDataButton = userCard.querySelector('.other-data-btn');
  const addressBoxDiv = userCard.querySelector('.address-box');

  otherDataButton.addEventListener('mouseenter', () => {
    addressBoxDiv.style.display = 'block';
  });

  otherDataButton.addEventListener('click', () => {
    const isVisible = addressBoxDiv.style.display === 'block';
    addressBoxDiv.style.display = isVisible ? 'none' : 'block';
  });
  
addressBoxDiv.addEventListener('click', (event) => {
  // Check if the clicked element is *not* inside an input-row
  if (!event.target.closest('.input-row')) {
    addressBoxDiv.style.display = 'none';
  }
});

  // Append new user card to DOM and internal list
  document.getElementById('usercard').appendChild(userCard);
  newUser.element = userCard;
  users.push(newUser);
}



window.onload = async () => {
  await getUser();
  await getTodos();
};
