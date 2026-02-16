import React from 'react';

const white = { color: "#fff", icolor: "#000" };
const black = { color: "#111", icolor: "#fff" };

const Piece = ({ children, className }) => (
    <svg viewBox="0 0 45 45" className={`w-full h-full ${className}`}>
        <g style={{ fillOpacity: 1, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
            {children}
        </g>
    </svg>
);

const Pawn = ({ color, icolor }) => (
    <Piece>
        <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill={color} stroke={icolor} strokeWidth="1.5" />
    </Piece>
);

const Rook = ({ color, icolor }) => (
    <Piece>
        <g fill={color} stroke={icolor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" strokeLinecap="butt" />
            <path d="M34 14l-3 3H14l-3-3" />
            <path d="M31 17v12.5H14V17" strokeLinecap="butt" strokeLinejoin="miter" />
            <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
            <path d="M11 14h23" fill="none" stroke={icolor} strokeLinejoin="miter" />
        </g>
    </Piece>
);

const Knight = ({ color, icolor }) => (
    <Piece>
        <g fill="none" fillRule="evenodd" stroke={icolor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" style={{ fill: color }} />
            <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,25.06 12.5,24 C 10.08,21.32 10.7,16 11,14 C 10.5,10.66 11.45,12 10.5,10.8 C 7.33,12 9.5,17 9.5,17 C 10.25,21.5 16,19 16,19 C 14.5,14 25,10 25,10" style={{ fill: color }} />
            <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5 25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" style={{ fill: icolor, stroke: icolor }} />
            <path d="M 15 15.5 A 0.5 1.5 0 1 1 14 15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" style={{ fill: icolor, stroke: icolor }} />
        </g>
    </Piece>
);

const Bishop = ({ color, icolor }) => (
    <Piece>
        <g fill={color} stroke={icolor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <g fill={color} stroke={icolor} strokeLinecap="butt">
                <path d="M9 36c3.39-.97 9.11-1.45 13.5-1.45C26.89 34.55 32.61 35.03 36 36v3H9v-3z" />
                <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
                <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
            </g>
            <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" strokeLinejoin="miter" />
        </g>
    </Piece>
);

const Queen = ({ color, icolor }) => (
    <Piece>
        <g fill={color} stroke={icolor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM10.5 19.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM38.5 19.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0z" fill={color} stroke={icolor} />
            <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11z" fill={color} stroke={icolor} strokeLinecap="butt" />
            <path d="M9 26c0 2 1.5 2 2.5 4 1 2.5 1 1 0.5 4 0 0-1.5 0-2.5 2 9.5-3 15-3 26 0 1-2.5-1-5 .5-4 0-2 .5-2.5 1.5-4 1-2 2.5-2 2.5-4-3.5 1.5-11 1.5-15 1s-11.5.5-15.5-1z" fill={color} stroke={icolor} strokeLinecap="butt" />
            <path d="M9 36c4-1 14.5-1 27 0v3H9v-3z" fill={color} stroke={icolor} strokeLinecap="butt" />
            <path d="M12 32h21M12 36h21" fill="none" stroke={icolor} />
        </g>
    </Piece>
);

const King = ({ color, icolor }) => (
    <Piece>
        <g fill={color} stroke={icolor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.5 11.63V6M20 8h5" strokeLinejoin="miter" />
            <path d="M22.5 25s4.5-7.5 3-10c-1.5-2.5-6-2.5-7.5 0-1.5 2.5 3 10 3 10" fill={color} stroke={icolor} />
            <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-5 2-8 2s-4-1-4-1v-4c0-5-7-5-7 0v4s-1 1-4 1-4-3-8-2c-3 6 6 10.5 6 10.5v7z" fill={color} stroke={icolor} />
            <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" fill="none" stroke={icolor} />
        </g>
    </Piece>
);

export const WhitePawn = () => (<Pawn {...white} />);
export const BlackPawn = () => (<Pawn {...black} />);
export const WhiteRook = () => (<Rook {...white} />);
export const BlackRook = () => (<Rook {...black} />);
export const WhiteKnight = () => (<Knight {...white} />);
export const BlackKnight = () => (<Knight {...black} />);
export const WhiteBishop = () => (<Bishop {...white} />);
export const BlackBishop = () => (<Bishop {...black} />);
export const WhiteQueen = () => (<Queen {...white} />);
export const BlackQueen = () => (<Queen {...black} />);
export const WhiteKing = () => (<King {...white} />);
export const BlackKing = () => (<King {...black} />);


// Add this to the end of Pieces.js
export const PieceMap = {
    'w': {
        'p': WhitePawn,
        'r': WhiteRook,
        'n': WhiteKnight,
        'b': WhiteBishop,
        'q': WhiteQueen,
        'k': WhiteKing
    },
    'b': {
        'p': BlackPawn,
        'r': BlackRook,
        'n': BlackKnight,
        'b': BlackBishop,
        'q': BlackQueen,
        'k': BlackKing
    }
};