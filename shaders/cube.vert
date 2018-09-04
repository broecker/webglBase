precision mediump float;


attribute vec3 vertexIn;

uniform mat4 projMatrix;
uniform mat4 viewMatrix;

uniform float sideLength;
uniform vec3 position;


void main()
{
	gl_Position = projMatrix * viewMatrix * vec4(vertexIn * sideLength + position, 1.0);
}