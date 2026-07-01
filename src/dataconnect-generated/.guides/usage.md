# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.


### Angular

The generated SDK creates injectable wrapper functions.

Here's an example:
```
import { injectCreateAppointment, injectListServices, injectUpdateUserProfile, injectGetUserAppointments, injectCreateServiceCall } from '@dataconnect/generated/angular';

@Component({
  selector: 'my-component',
  ...
})
class MyComponent {
  // The types of these injectors are available in angular/index.d.ts
  private readonly CreateAppointmentOperation = injectCreateAppointment(createAppointmentVars);
  private readonly ListServicesOperation = injectListServices();
  private readonly UpdateUserProfileOperation = injectUpdateUserProfile(updateUserProfileVars);
  private readonly GetUserAppointmentsOperation = injectGetUserAppointments();
  private readonly CreateServiceCallOperation = injectCreateServiceCall(createServiceCallVars);
  }
```

Each operation is a wrapper function around Tanstack Query Angular.

Here's an example:
```ts
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'simple-example',
  template: `
    @if (movies.isPending()) {
      Loading...
    }
    @if (movies.error()) {
      An error has occurred: {{ movies.error().message }}
    }
    @if (movies.data(); as data) {
      @for (movie of data.movies ; track
        movie.id) {
      <h1>{{ movie.title }}</h1>
      <p>{{ movie.synopsis }}</p>
      }
    }
  `
})
export class SimpleExampleComponent {
  http = inject(HttpClient)

  movies = injectListMovies();
}
```




## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createAppointment, listServices, updateUserProfile, getUserAppointments, createServiceCall } from '@dataconnect/generated';


// Operation CreateAppointment:  For variables, look at type CreateAppointmentVars in ../index.d.ts
const { data } = await CreateAppointment(dataConnect, createAppointmentVars);

// Operation ListServices: 
const { data } = await ListServices(dataConnect);

// Operation UpdateUserProfile:  For variables, look at type UpdateUserProfileVars in ../index.d.ts
const { data } = await UpdateUserProfile(dataConnect, updateUserProfileVars);

// Operation GetUserAppointments: 
const { data } = await GetUserAppointments(dataConnect);

// Operation CreateServiceCall:  For variables, look at type CreateServiceCallVars in ../index.d.ts
const { data } = await CreateServiceCall(dataConnect, createServiceCallVars);


```