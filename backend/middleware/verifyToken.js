import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No token provided, please login"
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: "Invalid token, please login again"
            });
        }
        req.userId = decoded.userId;    // Attach user info to request object
        next(); 

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token verification failed, please login again"
        });
    }
}