import jwt from 'jsonwebtoken';
import User, { IUser } from '../users/user.model';
import RefreshToken from './refresh-token.model';
import { UnauthorizedError, ValidationError } from '../../utils/errors';
import { RegisterInput, LoginInput } from './auth.validation';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export class AuthService {
  private generateAccessToken(user: IUser): string {
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  }

  private generateRefreshToken(user: IUser): string {
    return jwt.sign(
      {
        userId: user._id
      },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
  }

  // Register new user
  async register(data: RegisterInput) {
    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Create user
    const user = await User.create({
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role || 'operator'
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await RefreshToken.create({
      token: refreshToken,
      userId: user._id,
      expiresAt
    });

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      accessToken,
      refreshToken
    };
  }

  // Login user
  async login(data: LoginInput) {
    // Find user with password field
    const user = await User.findOne({ email: data.email }).select('+password');
    
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      token: refreshToken,
      userId: user._id,
      expiresAt
    });

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin
      },
      accessToken,
      refreshToken
    };
  }

  // Refresh access token
  async refreshAccessToken(token: string) {
    // Verify refresh token
    let payload: any;
    try {
      payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if token exists in database
    const storedToken = await RefreshToken.findOne({ token });
    if (!storedToken) {
      throw new UnauthorizedError('Refresh token not found or already used');
    }

    // Delete old refresh token (rotation)
    await RefreshToken.deleteOne({ token });

    // Find user
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Generate new tokens
    const accessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      token: newRefreshToken,
      userId: user._id,
      expiresAt
    });

    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  // Logout 
  async logout(token: string) {
    await RefreshToken.deleteOne({ token });
  }

  // Logout from all devices
  async logoutAll(userId: string) {
    const result = await RefreshToken.deleteMany({ userId });
    return {
      deletedCount: result.deletedCount
    };
  }

  // Verify access token
  verifyAccessToken(token: string) {
    try {
      return jwt.verify(token, ACCESS_TOKEN_SECRET) as {
        userId: string;
        email: string;
        role: string;
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }
}

export default new AuthService();