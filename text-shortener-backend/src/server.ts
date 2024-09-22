import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { summarizeText } from './summarizer';

dotenv.config();

const app = express();
app.use(express.json());

interface User {
  email: string;
  password: string;
}

// In-memory user storage (replace with a database in production)
const users: User[] = [];

app.post('/register', async (req: Request, res: Response) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user: User = { email: req.body.email, password: hashedPassword };
    users.push(user);
    res.status(201).send('User registered successfully');
  } catch {
    res.status(500).send('Error registering user');
  }
});

app.post('/login', async (req: Request, res: Response) => {
  const user = users.find(user => user.email === req.body.email);
  if (user == null) {
    return res.status(400).send('Cannot find user');
  }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      const accessToken = jwt.sign(user.email, process.env.ACCESS_TOKEN_SECRET as string);
      res.json({ accessToken: accessToken });
    } else {
      res.send('Not Allowed');
    }
  } catch {
    res.status(500).send('Error logging in');
  }
});

interface AuthRequest extends Request {
  user?: string;
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user as string;
    next();
  });
}

app.post('/shorten', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided for summarization' });
    }

    const summary = await summarizeText(text);
    res.json({ shortenedText: summary });
  } catch (error) {
    console.error('Error in text summarization:', error);
    res.status(500).json({ error: 'An error occurred during text summarization' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));