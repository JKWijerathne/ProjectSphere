import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const Home = () => <div className="p-8 text-center"><h1 className="text-4xl font-bold text-blue-700">ProjectSphere</h1><p className="mt-4 text-gray-600">Home Page</p></div>;
const Login = () => <div className="p-8 text-center">Login Page</div>;
const Register = () => <div className="p-8 text-center">Register Page</div>;
const ProjectList = () => <div className="p-8 text-center">Projects List</div>;
const NotFound = () => <div className="p-8 text-center">404 - Not Found</div>;

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;