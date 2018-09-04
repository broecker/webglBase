attribute vec2 positionIn;

varying vec3 rayDirection;
varying vec3 rayOrigin;
varying vec2 texcoords;

uniform mat4 inverseMVP;


void main()
{

	vec2 vertex = positionIn * 2.0 - vec2(1.0);

	vec4 farPlane = inverseMVP * vec4(vertex, 1.0, 1.0);
	farPlane /= farPlane.w;

	vec4 nearPlane = inverseMVP * vec4(vertex, -1.0, 1.0);
	nearPlane /= nearPlane.w;

	vec4 camPos = inverseMVP * vec4(0.0, 0.0, 0.0, 1.0);
	camPos /= camPos.w;

	rayDirection = (farPlane.xyz - nearPlane.xyz); 
	rayOrigin = nearPlane.xyz;

	gl_Position = vec4(vertex, 0.0, 1.0);

	texcoords = positionIn;
}