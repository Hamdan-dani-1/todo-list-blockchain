import React, { useState } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  AnchorProvider,
  Program,
  web3,
} from "@coral-xyz/anchor";
import idl from "../../target/idl/todo_auth_plain.json";
import "./App.css";
import {Buffer} from "buffer"

window.Buffer=Buffer

const programID = new PublicKey("9RH4R3tYTBSGtUKnAr6bHd42RuRZvzXb3b65cTGPpqRk");
const network = clusterApiUrl("devnet");
const opts = {
  preflightCommitment: "processed",
};

function App() {
  const [wallet, setWallet] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newTodo, setNewTodo] = useState("");
  const [todos, setTodos] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    return new AnchorProvider(connection, window.solana, opts);
  };

  const connectWallet = async () => {
    const resp = await window.solana.connect();
    setWallet(resp.publicKey.toString());
  };

  const getProgram = async () => {
    const provider = getProvider();
    return new Program(idl, programID, provider);
  };

  const getUserPDA = async () => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("user"), Buffer.from(username)],
      programID
    );
  };

  const register = async () => {
    const program = await getProgram();
    const [userPDA] = await getUserPDA();

    try {
      await program.methods
        .registerUser(username, password)
        .accounts({
          userAccount: userPDA,
          authority: window.solana.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      alert("✅ Registered successfully");
    } catch (err) {
      console.error("Registration error:", err);
    }
  };

  const login = async () => {
    const program = await getProgram();
    const [userPDA] = await getUserPDA();

    try {
      const user = await program.account.userAccount.fetch(userPDA);
      if (user.username === username && user.password === password) {
        setLoggedIn(true);
        setTodos(user.todos);
        alert("🔓 Login successful");
      } else {
        alert("❌ Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("❌ Account not found or wrong credentials");
    }
  };

  const addTodo = async () => {
    const program = await getProgram();
    const [userPDA] = await getUserPDA();

    try {
      await program.methods
        .addTodo(username, password, newTodo)
        .accounts({
          userAccount: userPDA,
          authority: window.solana.publicKey,
        })
        .rpc();

      const user = await program.account.userAccount.fetch(userPDA);
      setTodos(user.todos);
      setNewTodo("");
    } catch (err) {
      console.error("Add todo error:", err);
    }
  };

  return (
    <div className="app-container">
      <h1>📝 Solana Todo DApp</h1>

      {!wallet && <button onClick={connectWallet}>Connect Wallet</button>}
<div className="form-wrapper">
      {wallet && !loggedIn && (
        <>
          <div className="input-row">
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button onClick={register}>📝 Register</button>
          <button onClick={login}>🔓 Login</button>
        </>
      )}
</div>
      {wallet && loggedIn && (
        <>
          <h3>👤 Welcome, {username}</h3>

          <div className="todo-input-row">
            <input
              placeholder="New Todo"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
            />
            <button onClick={addTodo}>➕ Add Todo</button>
          </div>

          <div className="section-title">🗒️ Your Todos</div>
          <ul className="todo-list">
            {todos.map((todo, idx) => (
              <li key={idx}>{todo}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
