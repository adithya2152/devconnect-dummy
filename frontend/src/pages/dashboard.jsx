import NavBar from "../components/nav";
import useAuthGuard from "../hooks/useAuthGuarf";
import ChatWidget from '../components/chat/Chatbot';
import InlineChatbox from '../components/chat/InlineChatbox';
export default function Dashboard() {
    useAuthGuard();
  return (
    <div>
      <NavBar/>
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard!</p>
      <InlineChatbox/>
      <ChatWidget />
      {/* Add more dashboard components here */}
    </div>
  );
}