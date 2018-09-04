precision highp float;

varying vec3 rayDirection;
varying vec3 rayOrigin;
varying vec2 texcoords;


// point light
uniform vec3 light0;


struct Ray
{
	vec3		origin;
	vec3		direction;
	int 		depth;
};

struct Material
{
	vec3	diffuse;
	float 	reflectance;
};


struct Hit
{
	vec3		position;
	vec3		normal;
	float		t;

	Material 	material;
};


struct Triangle
{
	vec3		a, b, c;
	vec3		normal;
	Material	material;
};


struct Sphere
{
	// coords + radius
	vec3		center;
	float		radius;
	Material	material;
};


const float EPS = 0.0001;
const float START_T = 100000.0;
const int MAX_DEPTH = 3;





Ray initRay()
{
	Ray r;
	r.origin = rayOrigin;
	r.direction = normalize(rayDirection);
	r.depth = 0;

	return r;
}

float intersectRaySphere(in Ray ray, in Sphere sphere)
{
	// sphere intersection code from https://gist.github.com/num3ric/4408481	
	vec3 w = ray.origin - sphere.center;
	float wsq = dot(w,w);
	float rsq = sphere.radius*sphere.radius;

    float b = 2.0 * dot(ray.direction, w);
    float c = wsq - rsq;
    float disc = b * b - 4.0 * c;

    if (disc < 0.0)
        return -1.0;

    // compute q as described above
    float q;
    if (b < 0.0)
        q = (-b - sqrt(disc))/2.0;
    else
        q = (-b + sqrt(disc))/2.0;

    float t0 = q;
    float t1 = c / q;

    // make sure t0 is smaller than t1
    if (t0 > t1) 
    {
        // if t0 is bigger than t1 swap them around
        float temp = t0;
        t0 = t1;
        t1 = temp;
    }

    // if t1 is less than zero, the object is in the ray's negative direction
    // and consequently the ray misses the sphere
    if (t1 < 0.0)
        return -1.0;

    // if t0 is less than zero, the intersection point is at t1
    if (t0 < 0.0) 
		return t1;
	else
		return t0;

}

bool intersectRaySphereOcclusion(in Ray ray, in Sphere sphere)
{
	vec3 w = sphere.center - ray.origin;
	float proj = dot(w, ray.direction);

	float wsq = dot(w,w);
	float rsq = sphere.radius*sphere.radius;
	
	// if sphere behind ray
	if (proj < 0.0 && wsq > rsq)
		return false;

	float vsq = dot(ray.direction, ray.direction);
	return (vsq*wsq - proj*proj <= rsq*vsq); 
}

float intersectRayTriangle(in Ray ray, in Triangle tri)
{
	vec3 e1 = tri.b - tri.a;
	vec3 e2 = tri.c - tri.a;
	vec3 p = cross(ray.direction, e2);
	float a = dot(e1,p);

	if (abs(a) <= EPS)
		return -1.0;

	float f = 1.0 / a;
	
	// calculate barycentric coords
	vec3 s = ray.origin - tri.a;
	float u = f*dot(s, p);
	if (u < 0.0 || u > 1.0)
		return -1.0;

	vec3 q = cross(s, e1);
	float v = f*dot(ray.direction, q);

	// change u+v to v to check for quads!
	if (v < 0.0 || u+v > 1.0)
		return -1.0;

	float t = f*dot(e2, q);
	return t;
}

bool intersectRayTriangleOcclusion(in Ray ray, in Triangle tri)
{
	return intersectRayTriangle(ray, tri) >= 0.0;
}



float intersectRayYPlane(in Ray ray)
{
	return -ray.origin.y / ray.direction.y;
}

Sphere spheres[7];

void initScene()
{
	spheres[0].center = vec3(0.0, 4.0, 0.0);
	spheres[0].radius = 2.0;
	spheres[0].material.diffuse = vec3(0.7, 0.0, 0.0);
	spheres[0].material.reflectance = 0.1;

	spheres[1].center = vec3(3.0, 4.0, 0.0);
	spheres[1].radius = 1.0;
	spheres[1].material.diffuse = vec3(0.60, 0.0, 0.80);
	spheres[1].material.reflectance = 0.2;

	spheres[2].center = vec3(-3.0, 4.0, 0.0);
	spheres[2].radius = 1.0;
	spheres[2].material.diffuse = vec3(0.0, 0.60, 0.8);
	spheres[2].material.reflectance = 0.2;

	spheres[3].center = vec3(0.0, 4.0, 3.0);
	spheres[3].radius = 1.0;
	spheres[3].material.diffuse = vec3(0.7, 0.8, 0.0);
	spheres[3].material.reflectance = 0.2;

	spheres[4].center = vec3(0.0, 4.0, -3.0);
	spheres[4].radius = 1.0;
	spheres[4].material.diffuse = vec3(0.0, 0.8, 0.0);
	spheres[4].material.reflectance = 0.2;

	spheres[5].center = vec3(0.0, 7.0, 0.0);
	spheres[5].radius = 1.0;
	spheres[5].material.diffuse = vec3(0.0, 0.0, 1.0);
	spheres[5].material.reflectance = 0.2;

	spheres[6].center = vec3(0.0, 1.0, 0.0);
	spheres[6].radius = 1.0;
	spheres[6].material.diffuse = vec3(0.0, 0.0, 1.0);
	spheres[6].material.reflectance = 0.2;

}


// finds the closest hit
bool traceScene(in Ray ray, inout Hit hit)
{
	hit.t = START_T;

	float t = intersectRayYPlane(ray);
	if (t >= 0.0 && t <= hit.t)
	{
		hit.t = t;
		hit.position = ray.origin + ray.direction * t;
		hit.normal = vec3(0,1,0);
		hit.material.diffuse  = vec3(0.6);
		hit.material.reflectance = 0.0;//05;
	}


	for (int i = 0; i < 7; ++i)
	{
		t = intersectRaySphere(ray, spheres[i]);
		if (t >= 0.0 && t <= hit.t)
		{

			vec3 pos = ray.origin + ray.direction * t;; 
			vec3 N = normalize(pos - spheres[i].center);

			hit.t = t;
			hit.normal = N;
			hit.material = spheres[i].material;
			hit.position = pos;

		}
	}

	return hit.t < START_T;
}


vec3 shadeHit(in Hit hit)
{
	vec3 color = hit.material.diffuse;

	vec3 L = normalize(light0 - hit.position);

	// test for shadows
	Ray r;
	r.origin = hit.position + hit.normal * EPS;
	r.direction = L;

	float s = max(0.2, dot(L,hit.normal));

	for (int i = 0; i < 7; ++i)
		if (intersectRaySphereOcclusion(r, spheres[i]))
		{
			s = 0.2;
			break;
		}	
	color *= s;

	return color;
}


void main()
{
	Ray ray = initRay();

	initScene();
	vec3 color = ray.direction;//* 0.5;




	Hit hit;
	if (traceScene(ray, hit))	
	{
		color = shadeHit(hit);


		// cannot use a while loop in glsl :(
		for (int i =0 ; i < MAX_DEPTH; ++i)
		{

			// add reflections
			float r = hit.material.reflectance;
			if (r > 0.0)
			{

				vec3 R = reflect(ray.direction, hit.normal);
				ray.origin = hit.position + hit.normal * EPS;
				ray.direction = R;
				ray.depth += 1;

				vec3 color2;
				if (traceScene(ray, hit))
					color2 = shadeHit(hit);
				else
					color2 = ray.direction;
				
				color = mix(color, color2, r);
				
			}

		}

	}

	gl_FragColor = vec4(color, 1.0);

}	