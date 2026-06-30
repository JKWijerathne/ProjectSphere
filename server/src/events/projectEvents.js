import eventEmitter from './eventEmitter.js';

// Register general logging listeners for project actions
eventEmitter.on('ProjectCreated', ({ project }) => {
    console.log(`[Project Event] Project "${project.title}" (${project._id}) has been created.`);
});

eventEmitter.on('ProjectApproved', ({ project }) => {
    console.log(`[Project Event] Project "${project.title}" (${project._id}) was approved.`);
});

eventEmitter.on('ProjectRejected', ({ project }) => {
    console.log(`[Project Event] Project "${project.title}" (${project._id}) was rejected.`);
});
